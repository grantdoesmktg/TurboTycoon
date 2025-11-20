export enum CarTierType {
    JUNKER = 0,
    STREET_TUNER = 1,
    SPORTS = 2,
    SUPER = 3,
    HYPER = 4
}

export interface CarTier {
    id: CarTierType;
    name: string;
    multiplier: number;
    imagePlaceholder: string;
    requiredLifetimeHP: bigint;
}

export interface PartDefinition {
    id: string;
    name: string;
    baseCost: bigint;
    baseOutput: number; // HP per second
    costScaling: number;
    outputScaling: number;
    icon: string;
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
    redzoneStartTime: number | null; // Timestamp when entered 7000+ RPM
    
    // Upgrades
    throttleLevel: number;
    ecuLevel: number;
    parts: Record<string, number>; // PartId -> Level

    // Tokens
    tokens: number;
    tokensEarnedToday: number;
    lastTokenDate: string; // YYYY-MM-DD
    
    // Achievements
    achievements: string[]; // IDs of unlocked achievements
}

export interface GameConfig {
    MAX_RPM: number;
    REDLINE: number;
    DOWNSHIFT_THRESHOLD: number;
    GEAR_MULTIPLIERS: Record<number, number>;
    GLOBAL_COST_SCALING: number;
    GLOBAL_OUTPUT_SCALING: number;
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