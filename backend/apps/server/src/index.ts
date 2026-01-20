import { createContext } from "@backend/api/context";
import { appRouter } from "@backend/api/routers/index";
import prisma from "@backend/db";
import { env } from "@backend/env/server";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { z } from "zod";

import { generateMissionProposal } from "./ai/missionChain";
import {
  LOG_TYPES,
  MISSION_CATEGORIES,
  MISSION_DIFFICULTIES,
  MISSION_SOURCES,
  applyXpDelta,
  buildAttributeRewards,
  buildInitialMissions,
  calculateXpPenalty,
  calculateXpReward,
  getExpiresAtForCategory,
} from "./game";

const createObjectiveSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
  description: z.string().min(1),
});

const autoGenerateMissionsSchema = z.object({
  playerId: z.string().min(1),
});

const requestMissionSchema = z.object({
  playerId: z.string().min(1),
  message: z.string().min(1),
});

const completeMissionSchema = z.object({
  missionId: z.string().min(1),
});

const failMissionSchema = z.object({
  missionId: z.string().min(1),
});

const updateMissionProgressSchema = z.object({
  missionId: z.string().min(1),
  current: z.coerce.number().int().nonnegative(),
});

const rankingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const missionsQuerySchema = z.object({
  playerId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "EXPIRED"]).optional(),
});

const logQuerySchema = z.object({
  playerId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

const meQuerySchema = z.object({
  authUserId: z.string().min(1),
});

const updateUserSchema = z.object({
  authUserId: z.string().min(1),
  name: z.string().min(1).optional(),
  age: z.coerce.number().int().positive().optional(),
});

const updateSettingsSchema = z.object({
  playerId: z.string().min(1),
  autoMissionGeneration: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

async function requireSyncSecret(context: { request: Request; set: { status?: unknown } }) {
  if (!env.BACKEND_SYNC_SECRET) return true;
  const provided = context.request.headers.get("x-sync-secret");
  if (provided !== env.BACKEND_SYNC_SECRET) {
    context.set.status = 401;
    return false;
  }
  return true;
}

async function getRankingPosition(playerId: string) {
  const players = await prisma.player.findMany({
    orderBy: [{ level: "desc" }, { xp: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const index = players.findIndex((p) => p.id === playerId);
  return index >= 0 ? index + 1 : null;
}

async function recalculateRanking() {
  const players = await prisma.player.findMany({
    orderBy: [{ level: "desc" }, { xp: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (players.length > 0) {
    await prisma.$transaction(
      players.map((player: { id: string }, index: number) =>
        prisma.player.update({
          where: { id: player.id },
          data: { rank: index + 1 },
        }),
      ),
    );
  }

  return players.map((player: { id: string }, index: number) => ({
    playerId: player.id,
    position: index + 1,
  }));
}

function normalizeCategory(category: string) {
  const upper = category.toUpperCase();
  if (upper === MISSION_CATEGORIES.WEEKLY) return MISSION_CATEGORIES.WEEKLY;
  if (upper === MISSION_CATEGORIES.MONTHLY) return MISSION_CATEGORIES.MONTHLY;
  return MISSION_CATEGORIES.DAILY;
}

function buildMissionCreateData({
  playerId,
  proposal,
  source,
  now,
}: {
  playerId: string;
  proposal: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    progress: { target: number; unit: string };
    attributesFocus: string[];
  };
  source: (typeof MISSION_SOURCES)[keyof typeof MISSION_SOURCES];
  now: Date;
}) {
  const category = normalizeCategory(proposal.category);
  const difficultyRaw = proposal.difficulty.toUpperCase();
  const allowedDifficulties = Object.values(MISSION_DIFFICULTIES);
  const difficulty = allowedDifficulties.includes(
    difficultyRaw as (typeof MISSION_DIFFICULTIES)[keyof typeof MISSION_DIFFICULTIES],
  )
    ? (difficultyRaw as (typeof MISSION_DIFFICULTIES)[keyof typeof MISSION_DIFFICULTIES])
    : MISSION_DIFFICULTIES.E;
  const xpReward = calculateXpReward(difficulty, category);
  const xpPenalty = calculateXpPenalty(xpReward);
  const attributesRewarded = buildAttributeRewards(proposal.attributesFocus ?? [], category);

  return {
    playerId,
    category,
    title: proposal.title,
    description: proposal.description,
    difficulty,
    status: "PENDING" as const,
    xpReward,
    xpPenalty,
    attributesRewarded,
    progressCurrent: 0,
    progressTarget: proposal.progress.target,
    progressUnit: proposal.progress.unit,
    expiresAt: getExpiresAtForCategory(category, now),
    source,
  };
}

async function ensurePlayerSettings(playerId: string) {
  return prisma.playerSettings.upsert({
    where: { playerId },
    update: {},
    create: { playerId },
  });
}

async function generateMissionFromChain({
  playerId,
  message,
  source,
  requireAutoEnabled,
  enforceRateLimit,
}: {
  playerId: string;
  message?: string | null;
  source: (typeof MISSION_SOURCES)[keyof typeof MISSION_SOURCES];
  requireAutoEnabled?: boolean;
  enforceRateLimit?: boolean;
}) {
  const now = new Date();
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { user: true, settings: true },
  });

  if (!player) {
    return { error: "Jogador nao encontrado", status: 404 };
  }

  const settings = player.settings ?? (await ensurePlayerSettings(player.id));

  if (requireAutoEnabled && !settings.autoMissionGeneration) {
    return { skipped: true, reason: "auto_generation_disabled" };
  }

  if (enforceRateLimit && !settings.isPremium) {
    const since = new Date(now);
    since.setDate(since.getDate() - 1);
    const recentRequests = await prisma.mission.count({
      where: {
        playerId,
        source: MISSION_SOURCES.USER_REQUEST,
        createdAt: { gte: since },
      },
    });

    const DAILY_LIMIT = 20; // Altere aqui o limite diário para não-premium
    if (recentRequests >= DAILY_LIMIT) {
      return { error: `Limite diario atingido (${DAILY_LIMIT}/dia)`, status: 429 };
    }
  }

  if (requireAutoEnabled) {
    const activeMissions = await prisma.mission.count({
      where: { playerId, status: "PENDING" },
    });
    if (activeMissions > 0) {
      return { skipped: true, reason: "active_mission_exists" };
    }
  }

  const objective = await prisma.objective.findFirst({
    where: { playerId },
    orderBy: { createdAt: "desc" },
  });

  if (!objective) {
    return { error: "Objetivo nao encontrado para este jogador", status: 404 };
  }

  const historySince = new Date(now);
  historySince.setDate(historySince.getDate() - 7);
  const history = await prisma.mission.findMany({
    where: { playerId, createdAt: { gte: historySince } },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      category: true,
      status: true,
      difficulty: true,
      source: true,
      createdAt: true,
    },
  });

  const { proposal, fallback } = await generateMissionProposal({
    level: player.level,
    class: player.class,
    age: player.user.age,
    attributes: (player.attributes as Record<string, number> | null) ?? null,
    objective: objective.description,
    history,
    message,
  });

  const mission = await prisma.mission.create({
    data: buildMissionCreateData({
      playerId,
      proposal,
      source,
      now,
    }),
  });

  return { mission, fallback };
}

new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .group("/api", (app) =>
    app
      .post("/objective", async (context) => {
        // Proteção simples (opcional) para evitar que qualquer origem crie registros no seu backend.
        // Configure BACKEND_SYNC_SECRET no backend e BACKEND_SYNC_SECRET no frontend (Next API proxy).
        if (!(await requireSyncSecret(context))) return { error: "Nao autorizado" };

        const parsed = createObjectiveSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { userId, name, age, description } = parsed.data;
        if (description.trim().toLowerCase() === "pendente") {
          context.set.status = 400;
          return { error: "Objetivo invalido" };
        }

        const user = await prisma.user.upsert({
          where: { authUserId: userId },
          update: { name, age },
          create: { authUserId: userId, name, age },
        });

        const player = await prisma.player.upsert({
          where: { userId: user.id },
          update: { lastActiveAt: new Date() },
          create: { userId: user.id },
        });

        await prisma.playerSettings.upsert({
          where: { playerId: player.id },
          update: {},
          create: { playerId: player.id },
        });

        // Evita duplicação: expira missões pendentes antigas ao definir novo objetivo.
        const expired = await prisma.mission.updateMany({
          where: { playerId: player.id, status: "PENDING" },
          data: { status: "EXPIRED" },
        });
        if (expired.count > 0) {
          await prisma.systemLog.create({
            data: {
              playerId: player.id,
              message: "Missoes pendentes antigas expiradas por novo objetivo",
              type: LOG_TYPES.WARNING,
            },
          });
        }

        const objective = await prisma.objective.create({
          data: {
            playerId: player.id,
            description,
          },
        });

        const missionTemplates = buildInitialMissions(description);
        const now = new Date();
        const missions = await prisma.$transaction(
          missionTemplates.map((mission) =>
            prisma.mission.create({
              data: {
                ...buildMissionCreateData({
                  playerId: player.id,
                  proposal: mission,
                  source: MISSION_SOURCES.AUTOMATIC,
                  now,
                }),
              },
            }),
          ),
        );

        await prisma.systemLog.createMany({
          data: [
            {
              playerId: player.id,
              message: "Objetivo criado com sucesso",
              type: LOG_TYPES.INFO,
            },
            {
              playerId: player.id,
              message: "Missoes iniciais criadas",
              type: LOG_TYPES.SUCCESS,
            },
          ],
        });

        return {
          user,
          player,
          objective,
          missions,
        };
      })
      .get("/me", async (context) => {
        if (!(await requireSyncSecret(context))) return { error: "Nao autorizado" };

        const parsed = meQuerySchema.safeParse(context.query);
        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { authUserId } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { authUserId },
        });

        if (!user) {
          context.set.status = 404;
          return { error: "Usuario nao encontrado" };
        }

        const player = await prisma.player.findUnique({
          where: { userId: user.id },
          include: { settings: true },
        });

        if (!player) {
          context.set.status = 404;
          return { error: "Jogador nao encontrado" };
        }

        const settings = player.settings ?? (await ensurePlayerSettings(player.id));

        const latestObjective = await prisma.objective.findFirst({
          where: { playerId: player.id },
          orderBy: { createdAt: "desc" },
        });

        const position = await getRankingPosition(player.id);

        return {
          user,
          player,
          objective: latestObjective,
          ranking: position ? { position } : null,
          settings,
        };
      })
      .post("/user/update", async (context) => {
        if (!(await requireSyncSecret(context))) return { error: "Nao autorizado" };

        const parsed = updateUserSchema.safeParse(context.body);
        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { authUserId, name, age } = parsed.data;
        if (name === undefined && age === undefined) {
          context.set.status = 400;
          return { error: "Nada para atualizar" };
        }

        const user = await prisma.user.update({
          where: { authUserId },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(age !== undefined ? { age } : {}),
          },
        });

        return { user };
      })
      .post("/player/settings", async (context) => {
        const parsed = updateSettingsSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { playerId, autoMissionGeneration, isPremium } = parsed.data;
        if (autoMissionGeneration === undefined && isPremium === undefined) {
          context.set.status = 400;
          return { error: "Nada para atualizar" };
        }

        const settings = await prisma.playerSettings.upsert({
          where: { playerId },
          update: {
            ...(autoMissionGeneration !== undefined ? { autoMissionGeneration } : {}),
            ...(isPremium !== undefined ? { isPremium } : {}),
          },
          create: {
            playerId,
            autoMissionGeneration: autoMissionGeneration ?? true,
            isPremium: isPremium ?? false,
          },
        });

        return { settings };
      })
      .post("/missions/auto-generate", async (context) => {
        const parsed = autoGenerateMissionsSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { playerId } = parsed.data;
        const result = await generateMissionFromChain({
          playerId,
          source: MISSION_SOURCES.AUTOMATIC,
          requireAutoEnabled: true,
        });

        if ("error" in result && result.error) {
          context.set.status = result.status ?? 400;
          return { error: result.error };
        }

        if (result.skipped) {
          return { skipped: true, reason: result.reason };
        }

        await prisma.systemLog.create({
          data: {
            playerId,
            message: "Automatic mission generation executed.",
            type: LOG_TYPES.INFO,
          },
        });

        return { mission: result.mission, fallback: result.fallback };
      })
      .post("/missions/request", async (context) => {
        console.log("[POST /missions/request] Iniciando...");
        try {
          const parsed = requestMissionSchema.safeParse(context.body);

          if (!parsed.success) {
            console.log("[POST /missions/request] Validação falhou:", parsed.error.flatten());
            context.set.status = 400;
            return { error: parsed.error.flatten() };
          }

          const { playerId, message } = parsed.data;
          console.log("[POST /missions/request] playerId:", playerId, "message:", message);
          
          const result = await generateMissionFromChain({
            playerId,
            message,
            source: MISSION_SOURCES.USER_REQUEST,
            enforceRateLimit: true,
          });

          console.log("[POST /missions/request] Resultado da chain:", JSON.stringify(result, null, 2));

          if ("error" in result && result.error) {
            console.log("[POST /missions/request] Erro retornado:", result.error);
            context.set.status = result.status ?? 400;
            return { error: result.error };
          }

          await prisma.systemLog.create({
            data: {
              playerId,
              message: "User-requested mission generated.",
              type: LOG_TYPES.INFO,
            },
          });

          return { mission: result.mission, fallback: result.fallback };
        } catch (err) {
          console.error("[POST /missions/request] EXCEÇÃO:", err);
          context.set.status = 500;
          return { error: "Erro interno ao gerar missão", details: String(err) };
        }
      })
      .post("/missions/generate", async (context) => {
        const parsed = autoGenerateMissionsSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { playerId } = parsed.data;
        const result = await generateMissionFromChain({
          playerId,
          source: MISSION_SOURCES.AUTOMATIC,
          requireAutoEnabled: true,
        });

        if ("error" in result && result.error) {
          context.set.status = result.status ?? 400;
          return { error: result.error };
        }

        if (result.skipped) {
          return { skipped: true, reason: result.reason };
        }

        await prisma.systemLog.create({
          data: {
            playerId,
            message: "Automatic mission generation executed.",
            type: LOG_TYPES.INFO,
          },
        });

        return { mission: result.mission, fallback: result.fallback };
      })
      .get("/missions", async (context) => {
        const parsed = missionsQuerySchema.safeParse(context.query);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { playerId, limit, status } = parsed.data;

        const player = await prisma.player.findUnique({
          where: { id: playerId },
          select: { id: true },
        });

        if (!player) {
          context.set.status = 404;
          return { error: "Jogador nao encontrado" };
        }

        const missions = await prisma.mission.findMany({
          where: { playerId, ...(status ? { status } : {}) },
          orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { createdAt: "desc" }],
          take: limit ?? 50,
        });

        return { missions };
      })
      .post("/missions/complete", async (context) => {
        const parsed = completeMissionSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { missionId } = parsed.data;
        const mission = await prisma.mission.findUnique({
          where: { id: missionId },
          include: { player: true },
        });

        if (!mission) {
          context.set.status = 404;
          return { error: "Missao nao encontrada" };
        }

        if (mission.status === "COMPLETED") {
          return { mission };
        }

        if (mission.status === "FAILED" || mission.status === "EXPIRED") {
          context.set.status = 400;
          return { error: "Missao ja foi marcada como falha" };
        }

        const updatedProgress = applyXpDelta(mission.player.xp, mission.xpReward);

        const updatedMission = await prisma.mission.update({
          where: { id: mission.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });

        const updatedPlayer = await prisma.player.update({
          where: { id: mission.playerId },
          data: {
            xp: updatedProgress.xp,
            level: updatedProgress.level,
            class: updatedProgress.class,
            lastActiveAt: new Date(),
          },
        });

        await prisma.systemLog.create({
          data: {
            playerId: mission.playerId,
            message: `Missao concluida: ${mission.title}`,
            type: LOG_TYPES.SUCCESS,
          },
        });

        const ranking = await recalculateRanking();
        const playerRanking = ranking.find(
          (entry: { playerId: string; position: number }) =>
            entry.playerId === mission.playerId,
        );

        if (playerRanking) {
          await prisma.ranking.create({
            data: {
              playerId: mission.playerId,
              position: playerRanking.position,
              snapshotDate: new Date(),
            },
          });
        }

        return {
          mission: updatedMission,
          player: updatedPlayer,
          ranking: playerRanking ?? null,
        };
      })
      .post("/missions/progress", async (context) => {
        const parsed = updateMissionProgressSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { missionId, current } = parsed.data;
        const mission = await prisma.mission.findUnique({
          where: { id: missionId },
        });

        if (!mission) {
          context.set.status = 404;
          return { error: "Missao nao encontrada" };
        }

        if (mission.status !== "PENDING") {
          return { mission };
        }

        const clamped = Math.min(Math.max(0, current), mission.progressTarget);
        const updatedMission = await prisma.mission.update({
          where: { id: missionId },
          data: { progressCurrent: clamped },
        });

        return { mission: updatedMission };
      })
      .post("/missions/fail", async (context) => {
        const parsed = failMissionSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { missionId } = parsed.data;
        const mission = await prisma.mission.findUnique({
          where: { id: missionId },
          include: { player: true },
        });

        if (!mission) {
          context.set.status = 404;
          return { error: "Missao nao encontrada" };
        }

        if (mission.status !== "PENDING") {
          return { mission };
        }

        if (mission.expiresAt > new Date()) {
          context.set.status = 400;
          return { error: "Missao ainda nao expirou" };
        }

        const updatedProgress = applyXpDelta(mission.player.xp, -mission.xpPenalty);

        const updatedMission = await prisma.mission.update({
          where: { id: mission.id },
          data: { status: "FAILED" },
        });

        const updatedPlayer = await prisma.player.update({
          where: { id: mission.playerId },
          data: {
            xp: updatedProgress.xp,
            level: updatedProgress.level,
            class: updatedProgress.class,
            lastActiveAt: new Date(),
          },
        });

        await prisma.systemLog.create({
          data: {
            playerId: mission.playerId,
            message: `Missao falhou: ${mission.title}`,
            type: LOG_TYPES.FAILURE,
          },
        });

        const ranking = await recalculateRanking();
        const playerRanking = ranking.find(
          (entry: { playerId: string; position: number }) =>
            entry.playerId === mission.playerId,
        );

        if (playerRanking) {
          await prisma.ranking.create({
            data: {
              playerId: mission.playerId,
              position: playerRanking.position,
              snapshotDate: new Date(),
            },
          });
        }

        return {
          mission: updatedMission,
          player: updatedPlayer,
          ranking: playerRanking ?? null,
        };
      })
      .get("/ranking", async (context) => {
        const parsed = rankingQuerySchema.safeParse(context.query);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const players = await prisma.player.findMany({
          orderBy: [{ level: "desc" }, { xp: "desc" }, { createdAt: "asc" }],
          include: {
            user: true,
          },
          take: parsed.data.limit,
        });

        return {
          ranking: players.map(
            (
              player: {
                id: string;
                level: number;
                xp: number;
                class: string;
                user: { name: string };
              },
              index: number,
            ) => ({
              position: index + 1,
              playerId: player.id,
              name: player.user.name,
              level: player.level,
              xp: player.xp,
              class: player.class,
            }),
          ),
        };
      })
      .get("/system-log", async (context) => {
        const parsed = logQuerySchema.safeParse(context.query);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const logs = await prisma.systemLog.findMany({
          where: { playerId: parsed.data.playerId },
          orderBy: { createdAt: "desc" },
          take: parsed.data.limit,
        });

        return { logs };
      }),
  )
  .get("/", () => "OK")
  .listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
