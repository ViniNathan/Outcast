const LEVEL_XP_MULTIPLIER = 100;

export const PLAYER_CLASSES = {
  OUTCAST: "OUTCAST",
  SURVIVOR: "SURVIVOR",
  EXECUTOR: "EXECUTOR",
  DOMINANT: "DOMINANT",
} as const;

export const MISSION_CATEGORIES = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export const MISSION_DIFFICULTIES = {
  E: "E",
  D: "D",
  C: "C",
  B: "B",
  A: "A",
  S: "S",
} as const;

export const MISSION_SOURCES = {
  AUTOMATIC: "AUTOMATIC",
  USER_REQUEST: "USER_REQUEST",
} as const;

export const ATTRIBUTE_KEYS = [
  "discipline",
  "strength",
  "focus",
  "consistency",
] as const;

export const LOG_TYPES = {
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
} as const;

export function getClassForLevel(level: number) {
  if (level >= 13) return PLAYER_CLASSES.DOMINANT;
  if (level >= 8) return PLAYER_CLASSES.EXECUTOR;
  if (level >= 4) return PLAYER_CLASSES.SURVIVOR;
  return PLAYER_CLASSES.OUTCAST;
}

export function calculateLevelFromXp(xp: number) {
  let level = 1;
  let remainingXp = xp;

  while (remainingXp >= level * LEVEL_XP_MULTIPLIER) {
    remainingXp -= level * LEVEL_XP_MULTIPLIER;
    level += 1;
  }

  return level;
}

export function applyXpDelta(currentXp: number, delta: number) {
  const updatedXp = Math.max(0, currentXp + delta);
  const updatedLevel = calculateLevelFromXp(updatedXp);
  const updatedClass = getClassForLevel(updatedLevel);

  return {
    xp: updatedXp,
    level: updatedLevel,
    class: updatedClass,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getExpiresAtForCategory(category: string, now = new Date()) {
  if (category === MISSION_CATEGORIES.WEEKLY) {
    return addDays(now, 7);
  }

  if (category === MISSION_CATEGORIES.MONTHLY) {
    return addDays(now, 30);
  }

  return addDays(now, 1);
}

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  [MISSION_DIFFICULTIES.E]: 1,
  [MISSION_DIFFICULTIES.D]: 2,
  [MISSION_DIFFICULTIES.C]: 3,
  [MISSION_DIFFICULTIES.B]: 4,
  [MISSION_DIFFICULTIES.A]: 5,
  [MISSION_DIFFICULTIES.S]: 6,
};

const CATEGORY_MULTIPLIER: Record<string, number> = {
  [MISSION_CATEGORIES.DAILY]: 1,
  [MISSION_CATEGORIES.WEEKLY]: 2.5,
  [MISSION_CATEGORIES.MONTHLY]: 5,
};

export function calculateXpReward(difficulty: string, category: string) {
  const base = (DIFFICULTY_MULTIPLIER[difficulty] ?? 1) * 50;
  const multiplier = CATEGORY_MULTIPLIER[category] ?? 1;
  return Math.round(base * multiplier);
}

export function calculateXpPenalty(xpReward: number) {
  return Math.round(xpReward * 0.5);
}

export function buildAttributeRewards(attributesFocus: string[], category: string) {
  const base =
    category === MISSION_CATEGORIES.MONTHLY
      ? 3
      : category === MISSION_CATEGORIES.WEEKLY
        ? 2
        : 1;

  const rewards: Record<string, number> = {
    discipline: 0,
    strength: 0,
    focus: 0,
    consistency: 0,
  };

  const normalized = attributesFocus
    .map((item) => item.toLowerCase())
    .filter((item) => ATTRIBUTE_KEYS.includes(item as (typeof ATTRIBUTE_KEYS)[number]));

  if (normalized.length === 0) {
    rewards.consistency = base;
    return rewards;
  }

  for (const key of normalized) {
    rewards[key] = (rewards[key] ?? 0) + base;
  }

  return rewards;
}

export function buildFallbackMissionProposal(objectiveDescription: string) {
  return {
    title: "Operacao de contingencia",
    description: `Executar uma tarefa simples ligada a: ${objectiveDescription}`,
    category: "daily",
    difficulty: "E",
    progress: {
      target: 1,
      unit: "acao",
    },
    attributesFocus: ["consistency"],
  };
}

export function buildInitialMissions(objectiveDescription: string) {
  return [
    {
      title: "Primeira acao",
      description: `Definir a primeira acao para: ${objectiveDescription}`,
      category: "daily",
      difficulty: "E",
      progress: {
        target: 1,
        unit: "acao",
      },
      attributesFocus: ["discipline"],
    },
    {
      title: "Passo concreto",
      description: `Executar um passo concreto em: ${objectiveDescription}`,
      category: "daily",
      difficulty: "D",
      progress: {
        target: 1,
        unit: "tarefa",
      },
      attributesFocus: ["consistency"],
    },
    {
      title: "Marco semanal",
      description: `Concluir um marco semanal de: ${objectiveDescription}`,
      category: "weekly",
      difficulty: "C",
      progress: {
        target: 3,
        unit: "passos",
      },
      attributesFocus: ["focus"],
    },
  ];
}
