export interface SystemLog {
    id: string;
    timestamp: string;
    message: string;
    type: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  }
  
  export interface MissionType {
    rank: string;
    description: string;
    reward: string;
    penalty: string;
  }
  
  export interface PlayerStat {
    label: string;
    value: number;
    code: string;
  }
  
  export interface Quest {
    id: number;
    title: string;
    current: number;
    total: number;
    unit: string;
    completed: boolean;
  }