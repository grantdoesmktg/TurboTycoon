
import { GameState } from "../types";

const SAVE_KEY = "TURBO_TYCOON_V1";

// Helper to stringify BigInts
const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return `BI:${value.toString()}`;
    }
    return value;
};

// Helper to parse BigInts back
const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && value.startsWith('BI:')) {
        return BigInt(value.slice(3));
    }
    return value;
};

export const saveGame = (state: GameState) => {
    try {
        const serialized = JSON.stringify(state, replacer);
        localStorage.setItem(SAVE_KEY, serialized);
    } catch (e) {
        console.error("Failed to save game", e);
    }
};

export const loadGame = (): GameState | null => {
    try {
        const serialized = localStorage.getItem(SAVE_KEY);
        if (!serialized) return null;
        return JSON.parse(serialized, reviver) as GameState;
    } catch (e) {
        console.error("Failed to load game", e);
        return null;
    }
};

export const clearSave = () => {
    localStorage.removeItem(SAVE_KEY);
};
