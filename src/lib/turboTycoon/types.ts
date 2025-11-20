
export enum CarTierType {
  JUNKER = 0,
  STREET_TUNER = 1,
  SPORTS = 2,
  SUPER = 3,
  HYPER = 4,
}

export interface CarTier {
  id: CarTierType;
  name: string;
  multiplier: number;
  requiredLifetimeHP: bigint;
}

export interface PartDefinition {
  id: string;
  name: string;
  baseCost: bigint;
  baseOutput: number; // HP per second
  costScaling: number;
  outputScaling: number;
  icon: string; // Lucide icon name mapping
}

export interface GameState {
  // Core Stats
  totalHp: bigint;
  lifetimeHpEarned: bigint;
  currentTier: CarTierType;

  // Gameplay
  currentRpm: number;
  currentGear: number;
  lastClickTime: number; // Timestamp
  redzoneStartTime: number | null; // Timestamp

  // Upgrades
  throttleLevel: number;
  ecuLevel: number;
  parts: Record<string, number>; // PartId -> Level

  // Tokens
  tokensEarnedToday: number;
  lastTokenDate: string; // YYYY-MM-DD

  // Achievements
  achievements: string[];
}

export interface TokenPackage {
  id: string;
  hpCost: bigint;
  tokenAmount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardTokens: number;
  condition: (state: GameState, hpPerSecond: number) => boolean;
}
