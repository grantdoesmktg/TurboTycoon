export const formatHP = (val: bigint): string => {
    // Show exact integer with commas up to 1 million
    if (val < 1000000n) return Number(val).toLocaleString();
    
    // 1 Million+
    if (val < 1000000000n) return (Number(val) / 1000000).toFixed(2) + 'M';
    
    // 1 Billion+
    if (val < 1000000000000n) return (Number(val) / 1000000000).toFixed(2) + 'B';
    
    // 1 Trillion+
    return (Number(val) / 1000000000000).toFixed(2) + 'T';
};

export const calculatePartCost = (base: bigint, scaling: number, level: number): bigint => {
    // Cost = Base * (Scaling ^ Level)
    // Using float math for scaling factor then casting back to BigInt
    const factor = Math.pow(scaling, level);
    return BigInt(Math.floor(Number(base) * factor));
};

export const calculatePartOutput = (base: number, scaling: number, level: number): number => {
    // Output = Base * (Scaling ^ Level)
    if (level === 0) return 0;
    // Spec: "Output scaling: baseOutput * (1.10^level)"
    // Usually for a generator, Level 1 provides Base Output.
    // Level 2 provides Base * 1.10.
    // Formula: Base * (1.10 ^ (Level - 1)) ?
    // Or does the spec imply Base * 1.10^Level directly?
    // Let's assume Level 1 = Base.
    return Math.floor(base * Math.pow(scaling, level)); 
};