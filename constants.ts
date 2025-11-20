import { Achievement, CarTier, CarTierType, GameConfig, GameState, PartDefinition, TokenPackage } from "./types";

export const CONFIG: GameConfig = {
    MAX_RPM: 8000,
    REDLINE: 7000,
    DOWNSHIFT_THRESHOLD: 1500,
    GEAR_MULTIPLIERS: {
        1: 1.0,
        2: 1.25,
        3: 1.5,
        4: 1.75,
        5: 2.0,
        6: 2.5
    },
    GLOBAL_COST_SCALING: 1.12,
    GLOBAL_OUTPUT_SCALING: 1.10
};

export const CAR_TIERS: Record<CarTierType, CarTier> = {
    [CarTierType.JUNKER]: {
        id: CarTierType.JUNKER,
        name: "'02 Toyota Camry",
        multiplier: 1.0,
        imagePlaceholder: "https://picsum.photos/400/200?random=1",
        requiredLifetimeHP: 0n
    },
    [CarTierType.STREET_TUNER]: {
        id: CarTierType.STREET_TUNER,
        name: "'16 Honda Civic",
        multiplier: 1.5,
        imagePlaceholder: "https://picsum.photos/400/200?random=2",
        requiredLifetimeHP: 5_000_000n
    },
    [CarTierType.SPORTS]: {
        id: CarTierType.SPORTS,
        name: "'20 5.0 Ford Mustang",
        multiplier: 2.0,
        imagePlaceholder: "https://picsum.photos/400/200?random=3",
        requiredLifetimeHP: 50_000_000n
    },
    [CarTierType.SUPER]: {
        id: CarTierType.SUPER,
        name: "'22 Porsche 911",
        multiplier: 3.0,
        imagePlaceholder: "https://picsum.photos/400/200?random=4",
        requiredLifetimeHP: 500_000_000n
    },
    [CarTierType.HYPER]: {
        id: CarTierType.HYPER,
        name: "'25 Ferrari 296 GTB",
        multiplier: 4.0,
        imagePlaceholder: "https://picsum.photos/400/200?random=5",
        requiredLifetimeHP: 5_000_000_000n
    }
};

export const PARTS_LIST: PartDefinition[] = [
    { id: 'intake', name: 'Cold Air Intake', baseCost: 66n, baseOutput: 1, costScaling: 1.12, outputScaling: 1.10, icon: 'Wind' },
    { id: 'exhaust', name: 'Cat-Back Exhaust', baseCost: 201n, baseOutput: 3, costScaling: 1.12, outputScaling: 1.10, icon: 'Flame' },
    { id: 'ecu_map', name: 'Stage 1 ECU Map', baseCost: 696n, baseOutput: 8, costScaling: 1.12, outputScaling: 1.10, icon: 'Cpu' },
    { id: 'tires', name: 'Semi-Slick Tires', baseCost: 1500n, baseOutput: 20, costScaling: 1.12, outputScaling: 1.10, icon: 'CircleDashed' },
    { id: 'coilovers', name: 'Coilover Kit', baseCost: 4000n, baseOutput: 45, costScaling: 1.12, outputScaling: 1.10, icon: 'MoveVertical' },
    { id: 'downpipe', name: 'High-Flow Downpipe', baseCost: 10000n, baseOutput: 100, costScaling: 1.12, outputScaling: 1.10, icon: 'ArrowDownToLine' },
    { id: 'big_turbo', name: 'Big Turbo', baseCost: 25000n, baseOutput: 250, costScaling: 1.12, outputScaling: 1.10, icon: 'Fan' },
    { id: 'lsd_clutch', name: 'LSD & Clutch', baseCost: 60000n, baseOutput: 550, costScaling: 1.12, outputScaling: 1.10, icon: 'Cog' },
    { id: 'nitrous', name: 'Nitrous System', baseCost: 150000n, baseOutput: 1200, costScaling: 1.12, outputScaling: 1.10, icon: 'Zap' },
    { id: 'widebody', name: 'Widebody Aero', baseCost: 400000n, baseOutput: 3000, costScaling: 1.12, outputScaling: 1.10, icon: 'Maximize' },
];

export const MANUAL_UPGRADE_BASE_COST = 100n;
export const MANUAL_UPGRADE_SCALING = 1.12;

export const TOKEN_PACKAGES: TokenPackage[] = [
    { id: 'small', hpCost: 5_000_000n, tokenAmount: 3 },
    { id: 'medium', hpCost: 50_000_000n, tokenAmount: 15 },
    { id: 'large', hpCost: 500_000_000n, tokenAmount: 75 },
];

export const DAILY_TOKEN_CAP = 75;

export const ACHIEVEMENTS: Achievement[] = [
    // PROGRESSION
    {
        id: 'hp_1k',
        title: "Baby's First Beater",
        description: "You hit 1,000 Lifetime HP.",
        rewardTokens: 5,
        condition: (s) => s.lifetimeHpEarned >= 1_000n
    },
    {
        id: 'hp_10k',
        title: "Camry Weapon",
        description: "You hit 10,000 Lifetime HP.",
        rewardTokens: 10,
        condition: (s) => s.lifetimeHpEarned >= 10_000n
    },
    {
        id: 'hp_100k',
        title: "Faster Than Your Ex",
        description: "You hit 100,000 Lifetime HP.",
        rewardTokens: 10,
        condition: (s) => s.lifetimeHpEarned >= 100_000n
    },
    {
        id: 'hp_1m',
        title: "Ego Check",
        description: "Your car is faster than your ego. 1M HP.",
        rewardTokens: 15,
        condition: (s) => s.lifetimeHpEarned >= 1_000_000n
    },
    {
        id: 'hp_10m',
        title: "Vengeance Shift",
        description: "10 Million HP lifetime.",
        rewardTokens: 20,
        condition: (s) => s.lifetimeHpEarned >= 10_000_000n
    },
    {
        id: 'hp_100m',
        title: "Influencer Killer",
        description: "Beat 90% of Instagram builds. 100M HP.",
        rewardTokens: 25,
        condition: (s) => s.lifetimeHpEarned >= 100_000_000n
    },
    {
        id: 'hp_1b',
        title: "NASA Called",
        description: "They want their throttle body back. 1 Billion HP.",
        rewardTokens: 30,
        condition: (s) => s.lifetimeHpEarned >= 1_000_000_000n
    },
    {
        id: 'hp_10b',
        title: "EPA Violation",
        description: "The government is watching. 10 Billion HP.",
        rewardTokens: 40,
        condition: (s) => s.lifetimeHpEarned >= 10_000_000_000n
    },

    // GEARS
    {
        id: 'gear_6',
        title: "Boost Heaven",
        description: "Reach Gear 6 for the first time.",
        rewardTokens: 0,
        condition: (s) => s.currentGear === 6
    },

    // GENERATORS (PASSIVE)
    {
        id: 'passive_10k',
        title: "Day Job Replacement",
        description: "Reach 10,000 HP per second passive income.",
        rewardTokens: 10,
        condition: (_, hpPerSec) => hpPerSec >= 10_000
    },
    {
        id: 'passive_100k',
        title: "Printing Money",
        description: "Reach 100,000 HP per second passive income.",
        rewardTokens: 25,
        condition: (_, hpPerSec) => hpPerSec >= 100_000
    },

    // PRESTIGE
    {
        id: 'prestige_1',
        title: "Fresh Start",
        description: "Reach Prestige Tier 1.",
        rewardTokens: 0,
        condition: (s) => s.currentTier >= 1
    },
    {
        id: 'prestige_2',
        title: "Gapped Yourself",
        description: "Reach Prestige Tier 2.",
        rewardTokens: 10,
        condition: (s) => s.currentTier >= 2
    },
    {
        id: 'prestige_3',
        title: "HP Hoarder",
        description: "Reach Prestige Tier 3.",
        rewardTokens: 15,
        condition: (s) => s.currentTier >= 3
    },
    {
        id: 'prestige_4',
        title: "Illegal Build",
        description: "Reach Prestige Tier 4.",
        rewardTokens: 20,
        condition: (s) => s.currentTier >= 4
    },
    {
        id: 'prestige_5',
        title: "Peak Degeneracy",
        description: "Reach Prestige Tier 5.",
        rewardTokens: 25,
        condition: (s) => s.currentTier >= 5
    }
];