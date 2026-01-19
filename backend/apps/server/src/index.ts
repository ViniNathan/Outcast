import { createContext } from "@backend/api/context";
import { appRouter } from "@backend/api/routers/index";
import prisma from "@backend/db";
import { env } from "@backend/env/server";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { z } from "zod";

import {
  LOG_TYPES,
  MISSION_TYPES,
  applyXpDelta,
  buildGeneratedMissions,
  buildInitialMissions,
  getExpiresAtForType,
} from "./game";

const createObjectiveSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
  description: z.string().min(1),
});

const generateMissionsSchema = z.object({
  playerId: z.string().min(1),
  missions: z
    .array(
      z.object({
        type: z.enum([MISSION_TYPES.DAILY, MISSION_TYPES.WEEKLY]),
        description: z.string().min(1),
        xpReward: z.number().int().positive(),
        penaltyXp: z.number().int().nonnegative(),
        expiresAt: z.coerce.date().optional(),
      }),
    )
    .optional(),
});

const completeMissionSchema = z.object({
  missionId: z.string().min(1),
});

const failMissionSchema = z.object({
  missionId: z.string().min(1),
});

const rankingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const logQuerySchema = z.object({
  playerId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

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
        const parsed = createObjectiveSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { userId, name, age, description } = parsed.data;

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

        const objective = await prisma.objective.create({
          data: {
            playerId: player.id,
            description,
          },
        });

        const missionTemplates = buildInitialMissions(description);
        const missions = await prisma.$transaction(
          missionTemplates.map((mission) =>
            prisma.mission.create({
              data: {
                playerId: player.id,
                ...mission,
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
      .post("/missions/generate", async (context) => {
        const parsed = generateMissionsSchema.safeParse(context.body);

        if (!parsed.success) {
          context.set.status = 400;
          return { error: parsed.error.flatten() };
        }

        const { playerId, missions } = parsed.data;
        const now = new Date();

        const player = await prisma.player.findUnique({
          where: { id: playerId },
          select: { id: true },
        });

        if (!player) {
          context.set.status = 404;
          return { error: "Jogador nao encontrado" };
        }

        let missionList = missions;

        if (!missionList) {
          const latestObjective = await prisma.objective.findFirst({
            where: { playerId },
            orderBy: { createdAt: "desc" },
          });

          if (!latestObjective) {
            context.set.status = 404;
            return { error: "Objetivo nao encontrado para este jogador" };
          }

          missionList = buildGeneratedMissions(latestObjective.description, now);
        }

        const createdMissions = await prisma.$transaction(
          missionList.map((mission) =>
            prisma.mission.create({
              data: {
                playerId,
                type: mission.type,
                description: mission.description,
                xpReward: mission.xpReward,
                penaltyXp: mission.penaltyXp,
                expiresAt: mission.expiresAt ?? getExpiresAtForType(mission.type, now),
              },
            }),
          ),
        );

        await prisma.systemLog.create({
          data: {
            playerId,
            message: "Missoes geradas",
            type: LOG_TYPES.INFO,
          },
        });

        return { missions: createdMissions };
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

        if (mission.status === "FAILED") {
          context.set.status = 400;
          return { error: "Missao ja foi marcada como falha" };
        }

        const updatedProgress = applyXpDelta(mission.player.xp, mission.xpReward);

        const updatedMission = await prisma.mission.update({
          where: { id: mission.id },
          data: { status: "COMPLETED" },
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
            message: `Missao concluida: ${mission.description}`,
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

        const updatedProgress = applyXpDelta(
          mission.player.xp,
          -mission.penaltyXp,
        );

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
            message: `Missao falhou: ${mission.description}`,
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
