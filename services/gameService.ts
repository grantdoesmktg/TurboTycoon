import { PARTS_LIST, CONFIG } from "../constants";
import { GameState, PartDefinition } from "../types";
import { calculatePartOutput } from "../utils/formatters";

export const calculatePassiveIncome = (state: GameState): number => {
    let totalHpPerSec = 0;
    
    PARTS_LIST.forEach((part: PartDefinition) => {
        const level = state.parts[part.id] || 0;
        if (level > 0) {
            totalHpPerSec += calculatePartOutput(part.baseOutput, part.outputScaling, level);
        }
    });

    // Note: Passive income is NOT multiplied by Gear or Active multipliers in this spec
    // Unless "Global Multiplier" applies?
    // Spec says: "Prestige reward per tier: +2.0x global HP multiplier"
    // "Global Multiplier" usually applies to EVERYTHING.
    
    // Prestige Multiplier
    const prestigeMultiplier = Math.pow(2.0, state.currentTier);
    
    // Paid Plan Bonus (Simulated as 0 for now)
    const planBonus = 1.0; 
    
    // Apply Global Multipliers
    return totalHpPerSec * prestigeMultiplier * planBonus;
};

export const calculateRevIncome = (state: GameState, tierMult: number, gearMult: number): bigint => {
    // Base HP per tap: 10 HP + Throttle Upgrade (+5 per level)
    const baseClick = 10n + BigInt(state.throttleLevel * 5);
    
    // Prestige Multiplier: +2.0x per tier (2^Tier)
    const prestigeMultiplier = Math.pow(2.0, state.currentTier);
    
    // Combined Multiplier
    // Income = Base * Gear * CarTier * Prestige
    const totalMultiplier = gearMult * tierMult * prestigeMultiplier;
    
    return BigInt(Math.floor(Number(baseClick) * totalMultiplier));
};

export const calculateRPMGain = (state: GameState): number => {
    // Rebalanced for higher difficulty curve with Constant Drag model.
    // Base is significantly lower (90), and scaling is +5.
    // This requires users to spam clicks or upgrade ECU to beat the constant drag of higher gears.
    const baseRPM = 90;
    return baseRPM + (state.ecuLevel * 5);
};