
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Zap, Settings, Trophy, TrendingUp, Coins, Lock, RotateCcw, Briefcase, Medal,
    Wind, Flame, Cpu, CircleDashed, MoveVertical, ArrowDownToLine, Fan, Cog, Maximize,
    Clock, X
} from 'lucide-react';

import Speedometer from './components/Speedometer';
import { 
    CarTierType, GameState, PartDefinition, TokenPackage, Achievement 
} from './types';
import { 
    CONFIG, CAR_TIERS, PARTS_LIST, MANUAL_UPGRADE_BASE_COST, MANUAL_UPGRADE_SCALING, 
    TOKEN_PACKAGES, DAILY_TOKEN_CAP, ACHIEVEMENTS
} from './constants';
import { formatHP, calculatePartCost, calculatePartOutput } from './utils/formatters';
import { calculatePassiveIncome, calculateRevIncome, calculateRPMGain } from './services/gameService';
import { audioService } from './services/audioService';
import { loadGame, saveGame } from './utils/persistence';

// Icon Mapping
const ICON_MAP: Record<string, React.ElementType> = {
    'Wind': Wind,
    'Flame': Flame,
    'Cpu': Cpu,
    'CircleDashed': CircleDashed,
    'MoveVertical': MoveVertical,
    'ArrowDownToLine': ArrowDownToLine,
    'Fan': Fan,
    'Cog': Cog,
    'Zap': Zap,
    'Maximize': Maximize,
    'Settings': Settings // Fallback
};

// --- Initial State ---
const INITIAL_STATE: GameState = {
    totalHp: 0n,
    lifetimeHpEarned: 0n,
    currentTier: CarTierType.JUNKER,
    currentRpm: 0,
    currentGear: 1,
    lastClickTime: Date.now(),
    redzoneStartTime: null,
    throttleLevel: 0,
    ecuLevel: 0,
    parts: {},
    tokens: 0,
    tokensEarnedToday: 0,
    lastTokenDate: new Date().toISOString().split('T')[0],
    achievements: [],
};

const App: React.FC = () => {
    // Initialize state from storage or default
    const [gameState, setGameState] = useState<GameState>(() => {
        const saved = loadGame();
        if (saved) {
            // Merge with INITIAL_STATE to ensure new fields (like achievements) exist if loaded from old save
            return { ...INITIAL_STATE, ...saved };
        }
        return INITIAL_STATE;
    });

    const [hpPerSecond, setHpPerSecond] = useState<number>(0);
    
    // Achievement System State
    const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
    const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    
    // Perfect Shift & Audio State
    const [showPerfectShift, setShowPerfectShift] = useState<boolean>(false);

    // Offline Earnings Modal
    const [offlineEarnings, setOfflineEarnings] = useState<bigint>(0n);
    const [offlineTime, setOfflineTime] = useState<string>("");

    // Refs
    const stateRef = useRef<GameState>(gameState);

    // Sync ref and Auto-Save
    useEffect(() => {
        stateRef.current = gameState;
        // We don't save here on every render, we save in an interval
    }, [gameState]);

    // --- Offline Progress Calculation (Run Once on Mount) ---
    useEffect(() => {
        const saved = loadGame();
        if (saved) {
            const now = Date.now();
            // saved.lastClickTime is effectively the "last save time" or interaction time
            const lastTime = saved.lastClickTime; 
            const diffMs = now - lastTime;
            
            // Cap offline time to 24 hours (to prevent insane numbers if they leave for a year)
            const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
            const validDiffMs = Math.min(diffMs, MAX_OFFLINE_MS);

            if (validDiffMs > 10000) { // Only show if away for more than 10 seconds
                const passiveRate = calculatePassiveIncome(saved);
                if (passiveRate > 0) {
                    const seconds = validDiffMs / 1000;
                    const earned = BigInt(Math.floor(passiveRate * seconds));
                    
                    if (earned > 0n) {
                        setOfflineEarnings(earned);
                        
                        // Format time
                        const hrs = Math.floor(seconds / 3600);
                        const mins = Math.floor((seconds % 3600) / 60);
                        setOfflineTime(`${hrs > 0 ? `${hrs}h ` : ''}${mins}m`);

                        // Award HP immediately
                        setGameState(prev => ({
                            ...prev,
                            totalHp: prev.totalHp + earned,
                            lifetimeHpEarned: prev.lifetimeHpEarned + earned
                        }));
                    }
                }
            }
        }
    }, []);

    // --- Auto Save Loop (Every 5s) ---
    useEffect(() => {
        const saveInterval = setInterval(() => {
            saveGame(stateRef.current);
        }, 5000);
        
        // Save on visibility change (tab switch/close mobile)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveGame(stateRef.current);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(saveInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // --- Engine Loop ---
    useEffect(() => {
        const tickRate = 100; // 10Hz
        const SAFETY_SHIFT_THRESHOLD_MS = 1500; // Time in redline before forced shift
        
        const intervalId = setInterval(() => {
            const currentState = stateRef.current;
            
            // 1. Passive Income
            const actualPassivePerSec = calculatePassiveIncome(currentState);
            setHpPerSecond(actualPassivePerSec);
            
            const isDoubleTick = Math.random() < 0; 
            const tickMultiplier = isDoubleTick ? 2 : 1;
            const hpGenerated = BigInt(Math.floor(actualPassivePerSec * (tickRate / 1000) * tickMultiplier));
            
            let newRpm = currentState.currentRpm;
            let newGear = currentState.currentGear;
            let newRedzoneStart = currentState.redzoneStartTime;
            
            // 2. Constant Physics Drag (Decay)
            const baseDecay = 150;
            const dragFactor = Math.pow(1.8, newGear - 1);
            const decayPerSecond = baseDecay * dragFactor;
            
            // Calculate decay for this tick
            const decayAmount = Math.floor(decayPerSecond * (tickRate / 1000));
            
            // Apply decay
            newRpm = Math.max(0, newRpm - decayAmount);

            // 3. Safety Shift Logic (Auto-shift if stuck in redline too long)
            let safetyShiftTriggered = false;
            
            if (newGear < 6) {
                // We are in the redzone (7000 - 7999)
                if (newRpm >= CONFIG.REDLINE && newRpm < CONFIG.MAX_RPM) {
                    if (!newRedzoneStart) {
                        newRedzoneStart = Date.now(); // Should have been set by click, but failsafe
                    } else {
                        const timeInRed = Date.now() - newRedzoneStart;
                        if (timeInRed > SAFETY_SHIFT_THRESHOLD_MS) {
                            // Force Safety Shift
                            safetyShiftTriggered = true;
                            newGear += 1;
                            newRpm = 3000; // Safety shift punishment: drop low
                            newRedzoneStart = null;
                            
                            // Play standard shift sound (not perfect)
                            audioService.playUpshift();
                        }
                    }
                } else {
                    // Dropped out of redzone
                    newRedzoneStart = null;
                }
            } else {
                 // Gear 6 just holds
                 newRedzoneStart = null;
            }
            
            // Downshift Logic
            if (newRpm < CONFIG.DOWNSHIFT_THRESHOLD && newGear > 1) {
                newGear -= 1;
                newRpm = 4500; // Pop up revs slightly on downshift to catch
                newRedzoneStart = null;
                audioService.playDownshift();
            }

            // Need to update lastClickTime implicitly for save accuracy during idle
            // But we don't want to reset the "Manual Interaction" timer.
            // For saving purposes, we might just rely on the periodic save using current Date.now().
            // However, to accurately track "Offline Time", we should update a timestamp in state periodically.
            
            setGameState(prev => ({
                ...prev,
                totalHp: prev.totalHp + hpGenerated + (safetyShiftTriggered ? calculateRevIncome(prev, CAR_TIERS[prev.currentTier].multiplier, CONFIG.GEAR_MULTIPLIERS[prev.currentGear]) : 0n),
                lifetimeHpEarned: prev.lifetimeHpEarned + hpGenerated + (safetyShiftTriggered ? calculateRevIncome(prev, CAR_TIERS[prev.currentTier].multiplier, CONFIG.GEAR_MULTIPLIERS[prev.currentGear]) : 0n),
                currentRpm: newRpm,
                currentGear: newGear,
                redzoneStartTime: newRedzoneStart,
                lastClickTime: Date.now() // Constantly update this so save file is fresh
            }));

        }, tickRate);

        return () => clearInterval(intervalId);
    }, []);

    // --- Daily Reset Logic ---
    useEffect(() => {
        const checkDailyReset = () => {
            const today = new Date().toISOString().split('T')[0];
            if (gameState.lastTokenDate !== today) {
                setGameState(prev => ({
                    ...prev,
                    tokensEarnedToday: 0,
                    lastTokenDate: today
                }));
            }
        };
        checkDailyReset();
        const timer = setInterval(checkDailyReset, 60000); // Check every minute
        return () => clearInterval(timer);
    }, [gameState.lastTokenDate]);

    // --- Achievement Checker Loop (1s interval) ---
    useEffect(() => {
        const checkAchievements = () => {
            const currentState = stateRef.current;
            const newUnlocked: string[] = [];
            const newToasts: Achievement[] = [];

            ACHIEVEMENTS.forEach(ach => {
                if (currentState.achievements.includes(ach.id)) return; // Already unlocked

                // Check condition
                if (ach.condition(currentState, hpPerSecond)) {
                    newUnlocked.push(ach.id);
                    newToasts.push(ach);
                }
            });

            if (newUnlocked.length > 0) {
                setGameState(prev => ({
                    ...prev,
                    tokens: prev.tokens + newToasts.reduce((sum, a) => sum + a.rewardTokens, 0),
                    achievements: [...prev.achievements, ...newUnlocked]
                }));
                
                // Add to toast queue
                setAchievementQueue(prev => [...prev, ...newToasts]);
            }
        };

        const timer = setInterval(checkAchievements, 1000);
        return () => clearInterval(timer);
    }, [hpPerSecond]); 

    // --- Toast Processor System ---
    useEffect(() => {
        if (achievementQueue.length > 0 && !currentToast) {
            const next = achievementQueue[0];
            setCurrentToast(next);
            setAchievementQueue(prev => prev.slice(1)); 
            setShowToast(true);
        }
    }, [achievementQueue, currentToast]);

    useEffect(() => {
        if (currentToast) {
            const displayTimer = setTimeout(() => {
                setShowToast(false);
                const cleanupTimer = setTimeout(() => {
                    setCurrentToast(null);
                }, 500);
                return () => clearTimeout(cleanupTimer);
            }, 5000);
            return () => clearTimeout(displayTimer);
        }
    }, [currentToast]);

    // --- Actions ---

    const handleRev = useCallback(() => {
        // Initialize Audio on first user interaction
        audioService.init();
        audioService.resume();

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }

        const currentState = stateRef.current;
        const tier = CAR_TIERS[currentState.currentTier];
        const gearMult = CONFIG.GEAR_MULTIPLIERS[currentState.currentGear];
        
        // 1. Calculate potential new RPM
        const rpmGain = calculateRPMGain(currentState);
        let newRpm = currentState.currentRpm + rpmGain;
        let newGear = currentState.currentGear;
        let isPerfectShift = false;
        let isShift = false;
        let redzoneStart = currentState.redzoneStartTime;

        // 2. Check for Max/Shift Condition
        // Handle Entering Redzone
        if (newRpm >= CONFIG.REDLINE && currentState.currentRpm < CONFIG.REDLINE) {
            redzoneStart = Date.now();
        }

        // Handle Hitting The Limiter (Perfect Shift Point)
        if (newRpm >= CONFIG.MAX_RPM && newGear < 6) {
            isPerfectShift = true;
            isShift = true;
        } 
        // Just revving, cap at max if in gear 6
        else if (newRpm > CONFIG.MAX_RPM) {
            newRpm = CONFIG.MAX_RPM;
        }

        // 4. Calculate Earnings
        let earnedHp = calculateRevIncome(currentState, tier.multiplier, gearMult);
        
        if (isPerfectShift) {
            // Bonus: Perfect Shifts now keep RPM higher in the next gear
            audioService.playPerfectShift();
            setShowPerfectShift(true);
            setTimeout(() => setShowPerfectShift(false), 800); // Hide after anim
        }

        // 5. Apply Shift
        if (isShift) {
            if (!isPerfectShift) {
                audioService.playUpshift();
            }
            newGear += 1;
            
            // Reward: Perfect Shift starts at 5000 RPM (closer to power band)
            // Punishment/Standard: Safety Shift starts at 3000 RPM (grind)
            newRpm = isPerfectShift ? 5000 : 3000; 
            
            redzoneStart = null; // Clear timer
        }

        setGameState(prev => ({
            ...prev,
            totalHp: prev.totalHp + earnedHp,
            lifetimeHpEarned: prev.lifetimeHpEarned + earnedHp,
            currentRpm: newRpm,
            currentGear: newGear,
            // We do NOT update lastClickTime here because we are updating it in the loop now
            // actually, we can, it doesn't hurt.
            redzoneStartTime: redzoneStart
        }));
    }, []);

    const buyPart = (part: PartDefinition) => {
        const currentLevel = gameState.parts[part.id] || 0;
        const cost = calculatePartCost(part.baseCost, part.costScaling, currentLevel);
        
        if (gameState.totalHp >= cost) {
            setGameState(prev => ({
                ...prev,
                totalHp: prev.totalHp - cost,
                parts: {
                    ...prev.parts,
                    [part.id]: currentLevel + 1
                }
            }));
        }
    };

    const buyManualUpgrade = (type: 'throttle' | 'ecu') => {
        const level = type === 'throttle' ? gameState.throttleLevel : gameState.ecuLevel;
        const cost = calculatePartCost(BigInt(MANUAL_UPGRADE_BASE_COST), MANUAL_UPGRADE_SCALING, level);

        if (gameState.totalHp >= cost) {
            setGameState(prev => ({
                ...prev,
                totalHp: prev.totalHp - cost,
                throttleLevel: type === 'throttle' ? prev.throttleLevel + 1 : prev.throttleLevel,
                ecuLevel: type === 'ecu' ? prev.ecuLevel + 1 : prev.ecuLevel,
            }));
        }
    };
    
    const handlePrestige = () => {
        const nextTierIdx = gameState.currentTier + 1;
        if (nextTierIdx > CarTierType.HYPER) return;
        
        const nextTier = CAR_TIERS[nextTierIdx as CarTierType];
        if (gameState.lifetimeHpEarned >= nextTier.requiredLifetimeHP) {
             // Reset but keep lifetime stats
             const newState = {
                 ...INITIAL_STATE,
                 currentTier: nextTierIdx,
                 lifetimeHpEarned: gameState.lifetimeHpEarned,
                 tokens: gameState.tokens,
                 tokensEarnedToday: gameState.tokensEarnedToday,
                 lastTokenDate: gameState.lastTokenDate,
                 achievements: gameState.achievements
             };
             setGameState(newState);
             saveGame(newState); // Force save immediately
        }
    };

    const buyTokens = (pkg: TokenPackage) => {
        if (gameState.tokensEarnedToday > 0) {
            alert("You can only perform one token exchange per day.");
            return;
        }

        if (gameState.totalHp >= pkg.hpCost) {
            if (pkg.tokenAmount > DAILY_TOKEN_CAP) {
                 alert(`This package exceeds the daily limit of ${DAILY_TOKEN_CAP}.`);
                 return;
            }

            setGameState(prev => ({
                ...prev,
                totalHp: prev.totalHp - pkg.hpCost,
                tokens: prev.tokens + pkg.tokenAmount,
                tokensEarnedToday: prev.tokensEarnedToday + pkg.tokenAmount
            }));
        }
    };

    // --- Derived UI Values ---
    const currentTierData = CAR_TIERS[gameState.currentTier];
    const nextTierData = gameState.currentTier < CarTierType.HYPER ? CAR_TIERS[(gameState.currentTier + 1) as CarTierType] : null;
    const isRedlining = gameState.currentRpm >= CONFIG.REDLINE;
    const isHighRpm = gameState.currentRpm > 6000;
    const isOverheating = !!gameState.redzoneStartTime; // Show warning if timer is running
    
    const throttleCost = calculatePartCost(BigInt(MANUAL_UPGRADE_BASE_COST), MANUAL_UPGRADE_SCALING, gameState.throttleLevel);
    const ecuCost = calculatePartCost(BigInt(MANUAL_UPGRADE_BASE_COST), MANUAL_UPGRADE_SCALING, gameState.ecuLevel);
    
    const prestigeProgress = nextTierData 
        ? Math.min(100, Number(gameState.lifetimeHpEarned * 100n / nextTierData.requiredLifetimeHP))
        : 100;

    return (
        <div className="h-screen flex flex-col bg-carbon text-slate-100 font-sans overflow-hidden relative">
            
            {/* Visual Overlays */}
            <div className="absolute inset-0 bg-grid pointer-events-none z-0 opacity-50" />
            <div className="absolute inset-0 scanlines z-[60] opacity-10" />
            <div className="absolute inset-0 vignette z-[60]" />
            
            {/* Redline Pulse Overlay */}
            <div 
                className={`
                    absolute inset-0 z-[55] pointer-events-none transition-all duration-300
                    ${isOverheating || isRedlining ? 'animate-redline-flash opacity-100' : 'opacity-0'}
                `} 
            />

            {/* Welcome Back Modal (Offline Earnings) */}
            {offlineEarnings > 0n && (
                <div className="absolute inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-panel rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green to-emerald-600"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                                <p className="text-xs text-slate-400">Your garage kept working while you were away.</p>
                            </div>
                            <button onClick={() => setOfflineEarnings(0n)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-800 p-2 rounded-lg text-neon-green">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Time Away</div>
                                    <div className="font-mono font-bold text-slate-200">{offlineTime}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Earned</div>
                                <div className="font-mono font-bold text-xl text-neon-green">+{formatHP(offlineEarnings)} HP</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setOfflineEarnings(0n)}
                            className="w-full py-3 bg-neon-green text-slate-900 font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            COLLECT REVENUE
                        </button>
                    </div>
                </div>
            )}

            {/* Achievement Toast */}
            <div className={`
                absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-sm
                glass-panel rounded-xl p-4 shadow-[0_0_30px_rgba(251,191,36,0.15)]
                transition-all duration-500 transform
                ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}
            `}>
                {currentToast && (
                    <div className="flex items-start gap-3">
                        <div className="bg-slate-900 p-2 rounded-lg text-neon-yellow shrink-0">
                            <Medal size={24} />
                        </div>
                        <div>
                            <div className="text-xs text-neon-yellow font-bold tracking-widest uppercase mb-1">Achievement Unlocked</div>
                            <div className="font-bold text-white text-sm mb-0.5">{currentToast.title}</div>
                            <div className="text-xs text-slate-400 leading-snug mb-2">{currentToast.description}</div>
                            {currentToast.rewardTokens > 0 && (
                                <div className="inline-flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded text-xs font-mono text-neon-cyan border border-slate-700">
                                    <Coins size={10} /> +{currentToast.rewardTokens} Tokens
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Header - Z-Index raised to 70 to sit above Vignette (z-60) */}
            <header className="shrink-0 z-[70] glass-panel border-b-0 border-b-white/5 px-4 py-3 shadow-lg relative">
                <div className="flex justify-between items-center max-w-6xl mx-auto w-full">
                    {/* Left: Total HP */}
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-neon-cyan tabular-nums tracking-tight drop-shadow-[0_0_10px_rgba(0,255,217,0.6)]">
                                {formatHP(gameState.totalHp)} <span className="text-sm text-slate-500">HP</span>
                            </span>
                        </div>
                    </div>

                    {/* Right: HP/s and Car Name */}
                    <div className="text-right">
                        <div className="text-xs font-bold text-neon-green flex items-center justify-end gap-1 mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                            <TrendingUp size={14} />
                            {formatHP(BigInt(Math.floor(hpPerSecond)))}/s
                        </div>
                         <div className="text-[10px] font-mono text-slate-300 uppercase tracking-widest drop-shadow-md">
                            {currentTierData.name}
                        </div>
                    </div>
                </div>
                
                {/* Prestige Progress Bar */}
                {nextTierData && (
                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-800/50 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-neon-yellow to-orange-500 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                            style={{ width: `${prestigeProgress}%` }}
                        />
                    </div>
                )}
            </header>

            {/* Main Content - Split View */}
            <main className="flex-1 flex flex-col landscape:flex-row overflow-y-auto landscape:overflow-hidden relative z-10">
                
                {/* Dashboard Section */}
                <section className="
                    shrink-0
                    landscape:order-2 landscape:w-1/2 landscape:h-full 
                    landscape:flex landscape:flex-col landscape:justify-center landscape:items-center
                    landscape:border-l landscape:border-white/5 landscape:bg-slate-900/30
                    pt-6 pb-10 landscape:py-0
                    cursor-pointer select-none touch-manipulation
                ">
                    <div 
                        onClick={handleRev}
                        className="
                            landscape:scale-75 landscape:origin-center 
                            w-full flex flex-col items-center justify-center relative
                        "
                    >
                        {/* Ambient Glow Behind Gauge */}
                        <div className={`
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full blur-[60px] transition-all duration-500
                            ${isRedlining || isOverheating ? 'bg-neon-red opacity-40 scale-125' : isHighRpm ? 'bg-neon-red opacity-20' : 'bg-neon-cyan opacity-10'}
                        `} />

                        <div className="relative z-10">
                            <Speedometer 
                                rpm={gameState.currentRpm} 
                                gear={gameState.currentGear}
                                isRedlining={isRedlining}
                                showPerfectShift={showPerfectShift}
                                isOverheating={isOverheating}
                            />
                        </div>
                        
                        <div className="mt-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest opacity-50 animate-pulse">
                            Tap to Rev
                        </div>
                    </div>
                </section>

                {/* Upgrades Section */}
                <section className="
                    flex-1
                    landscape:order-1 landscape:w-1/2 landscape:h-full landscape:overflow-y-auto
                    px-4 pb-20 landscape:pb-10 landscape:px-8
                    w-full max-w-md landscape:max-w-none mx-auto
                ">
                    
                    {/* Manual Upgrades */}
                    <div className="mt-2 mb-8 grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => buyManualUpgrade('throttle')}
                            disabled={gameState.totalHp < throttleCost}
                            className={`p-3 rounded-xl glass-panel transition-all active:scale-95 text-left group
                                ${gameState.totalHp < throttleCost ? 'opacity-50' : 'hover:border-neon-cyan/30 hover:shadow-[0_0_15px_rgba(0,255,217,0.1)]'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Settings size={20} className="text-slate-400 group-hover:text-neon-cyan transition-colors" />
                                <span className="bg-slate-900/80 text-xs px-1.5 py-0.5 rounded text-slate-300 font-mono border border-white/5">
                                    Lvl {gameState.throttleLevel}
                                </span>
                            </div>
                            <div className="text-sm font-bold mb-0.5 text-slate-100">Throttle</div>
                            <div className="text-[10px] text-slate-400 mb-1">+5 HP/Click</div>
                            <div className="text-xs text-neon-yellow font-mono">{formatHP(throttleCost)} HP</div>
                        </button>

                        <button 
                            onClick={() => buyManualUpgrade('ecu')}
                            disabled={gameState.totalHp < ecuCost}
                            className={`p-3 rounded-xl glass-panel transition-all active:scale-95 text-left group
                                ${gameState.totalHp < ecuCost ? 'opacity-50' : 'hover:border-neon-cyan/30 hover:shadow-[0_0_15px_rgba(0,255,217,0.1)]'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Zap size={20} className="text-slate-400 group-hover:text-neon-cyan transition-colors" />
                                <span className="bg-slate-900/80 text-xs px-1.5 py-0.5 rounded text-slate-300 font-mono border border-white/5">
                                    Lvl {gameState.ecuLevel}
                                </span>
                            </div>
                            <div className="text-sm font-bold mb-0.5 text-slate-100">ECU Chip</div>
                            <div className="text-[10px] text-slate-400 mb-1">+5 RPM/Click</div>
                            <div className="text-xs text-neon-yellow font-mono">{formatHP(ecuCost)} HP</div>
                        </button>
                    </div>

                    {/* Parts Shop */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Briefcase size={16} />
                            Performance Shop
                        </h3>
                        
                        <div className="space-y-3">
                            {PARTS_LIST.map(part => {
                                const level = gameState.parts[part.id] || 0;
                                const cost = calculatePartCost(part.baseCost, part.costScaling, level);
                                const currentOutput = calculatePartOutput(part.baseOutput, part.outputScaling, level);
                                const nextOutput = calculatePartOutput(part.baseOutput, part.outputScaling, level + 1);
                                const canAfford = gameState.totalHp >= cost;
                                const PartIcon = ICON_MAP[part.icon] || Settings;
                                
                                return (
                                    <div 
                                        key={part.id}
                                        className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-neon-cyan transition-colors">
                                                <PartIcon size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-100">{part.name}</span>
                                                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold border border-white/5">
                                                        L{level}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <TrendingUp size={10} />
                                                    <span className={level > 0 ? "text-white" : "text-slate-500"}>{formatHP(BigInt(currentOutput))}/s</span>
                                                    <span className="text-neon-green text-[10px]">→ {formatHP(BigInt(nextOutput))}/s</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => buyPart(part)}
                                            disabled={!canAfford}
                                            className={`
                                                px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 min-w-[80px] border
                                                ${canAfford 
                                                    ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 shadow-[0_0_10px_rgba(0,255,217,0.1)]' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            {formatHP(cost)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Token Exchange */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Coins size={16} />
                            TunedUp Token Exchange
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {TOKEN_PACKAGES.map(pkg => {
                                const canAfford = gameState.totalHp >= pkg.hpCost;
                                const hasExchangedToday = gameState.tokensEarnedToday > 0;
                                const isDisabled = !canAfford || hasExchangedToday;
                                
                                return (
                                    <button 
                                        key={pkg.id}
                                        onClick={() => buyTokens(pkg)}
                                        disabled={isDisabled}
                                        className={`
                                            p-3 rounded-xl glass-panel flex flex-col items-center text-center transition-all active:scale-95
                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neon-yellow hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]'}
                                        `}
                                    >
                                        <span className="text-lg font-bold text-white mb-1">{pkg.tokenAmount}</span>
                                        <span className="text-[10px] text-neon-yellow uppercase font-bold mb-2">Tokens</span>
                                        <div className="text-[10px] font-mono bg-slate-900/50 border border-white/5 px-2 py-1 rounded w-full text-slate-300">
                                            {formatHP(pkg.hpCost)} HP
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                        {gameState.tokensEarnedToday > 0 && (
                             <div className="mt-2 text-center text-xs text-neon-yellow font-mono">
                                 Daily exchange complete. Come back tomorrow.
                             </div>
                        )}
                    </div>
                    
                    {/* Prestige / Next Tier Info */}
                    <div className="mb-6 p-6 glass-panel rounded-2xl text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-yellow to-orange-500 opacity-50"></div>
                        <div className="flex justify-center mb-3">
                            <Trophy size={32} className={prestigeProgress >= 100 ? "text-neon-yellow animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "text-slate-600"} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Next Tier: {nextTierData ? nextTierData.name : "MAX LEVEL"}</h3>
                        <p className="text-xs text-slate-400 mb-4 max-w-[240px] mx-auto leading-relaxed">
                            {nextTierData 
                                ? `Reach ${formatHP(nextTierData.requiredLifetimeHP)} Lifetime HP to unlock Prestige Tier ${gameState.currentTier + 1}.`
                                : "You are the King of the Road."}
                        </p>
                        
                        {nextTierData && (
                            <button
                                onClick={handlePrestige}
                                disabled={prestigeProgress < 100}
                                className={`
                                    w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border
                                    ${prestigeProgress >= 100
                                        ? 'bg-neon-yellow/10 border-neon-yellow text-neon-yellow hover:bg-neon-yellow/20 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed'}
                                `}
                            >
                                {prestigeProgress >= 100 ? <><RotateCcw size={16} /> PRESTIGE TO TIER {gameState.currentTier + 1}</> : <><Lock size={16} /> LOCKED</>}
                            </button>
                        )}
                        <div className="mt-3 text-[10px] text-slate-500">
                            Prestige resets upgrades but doubles Global Multiplier.
                        </div>
                    </div>
                    
                    <footer className="text-center text-[10px] text-slate-600 font-mono py-4">
                        TURBO TYCOON SIMULATOR v2.0
                        <div className="mt-1 text-slate-700">Balanced Edition</div>
                    </footer>

                </section>

            </main>
        </div>
    );
};

export default App;
