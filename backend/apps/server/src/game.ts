const LEVEL_XP_MULTIPLIER = 100;

export const PLAYER_CLASSES = {
  OUTCAST: "OUTCAST",
  SURVIVOR: "SURVIVOR",
  EXECUTOR: "EXECUTOR",
  DOMINANT: "DOMINANT",
} as const;

export const MISSION_TYPES = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
} as const;

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

export function getExpiresAtForType(type: string, now = new Date()) {
  if (type === MISSION_TYPES.WEEKLY) {
    return addDays(now, 7);
  }

  return addDays(now, 1);
}

export function buildInitialMissions(objectiveDescription: string, now = new Date()) {
  return [
    {
      type: MISSION_TYPES.DAILY,
      description: `Definir a primeira acao para: ${objectiveDescription}`,
      xpReward: 50,
      penaltyXp: 20,
      expiresAt: getExpiresAtForType(MISSION_TYPES.DAILY, now),
    },
    {
      type: MISSION_TYPES.DAILY,
      description: `Executar um passo concreto em: ${objectiveDescription}`,
      xpReward: 60,
      penaltyXp: 25,
      expiresAt: getExpiresAtForType(MISSION_TYPES.DAILY, now),
    },
    {
      type: MISSION_TYPES.WEEKLY,
      description: `Concluir um marco semanal de: ${objectiveDescription}`,
      xpReward: 150,
      penaltyXp: 60,
      expiresAt: getExpiresAtForType(MISSION_TYPES.WEEKLY, now),
    },
  ];
}

export function buildGeneratedMissions(objectiveDescription: string, now = new Date()) {
  return [
    {
      type: MISSION_TYPES.DAILY,
      description: `Revisar prioridades ligadas a: ${objectiveDescription}`,
      xpReward: 40,
      penaltyXp: 20,
      expiresAt: getExpiresAtForType(MISSION_TYPES.DAILY, now),
    },
    {
      type: MISSION_TYPES.DAILY,
      description: `Entregar uma tarefa ligada a: ${objectiveDescription}`,
      xpReward: 70,
      penaltyXp: 30,
      expiresAt: getExpiresAtForType(MISSION_TYPES.DAILY, now),
    },
    {
      type: MISSION_TYPES.WEEKLY,
      description: `Fechar a semana com progresso em: ${objectiveDescription}`,
      xpReward: 180,
      penaltyXp: 70,
      expiresAt: getExpiresAtForType(MISSION_TYPES.WEEKLY, now),
    },
  ];
}
