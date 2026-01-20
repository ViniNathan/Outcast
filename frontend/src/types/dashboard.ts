export interface SystemLog {
  id: string;
  createdAt: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "FAILURE";
}

export interface PlayerStat {
  label: string;
  value: number;
  code: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: "DAILY" | "WEEKLY" | "MONTHLY";
  difficulty: "E" | "D" | "C" | "B" | "A" | "S";
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED";
  xpReward: number;
  xpPenalty: number;
  attributesRewarded?: Record<string, number> | null;
  progressCurrent: number;
  progressTarget: number;
  progressUnit: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string | null;
  source: "AUTOMATIC" | "USER_REQUEST";
}

export interface ChatMessage {
  id: string;
  sender: "USER" | "SYSTEM";
  text: string;
  timestamp: Date;
}

export interface RankEntry {
  rank: number;
  name: string;
  level: number;
  job: string;
  isUser?: boolean;
}