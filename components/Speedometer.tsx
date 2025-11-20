import React from 'react';
import { CONFIG } from '../constants';

interface SpeedometerProps {
    rpm: number;
    gear: number;
    isRedlining: boolean;
    showPerfectShift?: boolean;
    isOverheating?: boolean;
}

const Speedometer: React.FC<SpeedometerProps> = ({ rpm, gear, isRedlining, showPerfectShift, isOverheating }) => {
    // Arc settings
    const radius = 120;
    const stroke = 15;
    const normalizedRPM = Math.min(rpm, CONFIG.MAX_RPM);
    const maxRPM = CONFIG.MAX_RPM;
    
    // Angle calculation: -135 deg to +135 deg
    const startAngle = -135;
    const endAngle = 135;
    const totalAngle = endAngle - startAngle;
    const currentAngle = startAngle + (normalizedRPM / maxRPM) * totalAngle;

    // Helper to convert polar to cartesian
    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: cx + (r * Math.cos(angleInRadians)),
            y: cy + (r * Math.sin(angleInRadians))
        };
    };

    const cx = 150;
    const cy = 150;
    
    // Background Arc
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArcFlag = totalAngle <= 180 ? "0" : "1";
    const dBg = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");

    // Redline Arc (Start at 7000 RPM equivalent)
    const redlineStartAngle = startAngle + (CONFIG.REDLINE / maxRPM) * totalAngle;
    const redlineStart = polarToCartesian(cx, cy, radius, redlineStartAngle);
    const dRedline = [
        "M", redlineStart.x, redlineStart.y, 
        "A", radius, radius, 0, 0, 1, end.x, end.y
    ].join(" ");

    // Spring animation style
    const needleStyle = {
        transform: `rotate(${currentAngle}deg)`,
        transformOrigin: `${cx}px ${cy}px`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };

    // Glow Logic
    const isHighRpmZone = !isRedlining && rpm >= 6000 && rpm < 7000;
    
    return (
        <div className={`
            relative flex items-center justify-center w-[300px] h-[220px] mx-auto mt-6 transition-all duration-200
            ${isRedlining ? 'drop-shadow-[0_0_15px_rgba(0,255,217,0.6)]' : ''}
            ${isHighRpmZone ? 'drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]' : ''}
            ${isOverheating ? 'drop-shadow-[0_0_40px_rgba(239,68,68,0.9)]' : ''}
        `}>
            <svg width="300" height="220" viewBox="0 0 300 220" className="overflow-visible">
                {/* Background Gauge */}
                <path d={dBg} fill="none" stroke="#1e293b" strokeWidth={stroke} strokeLinecap="round" />
                
                {/* Active Gauge (Redline zone) */}
                <path 
                    d={dRedline} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth={stroke} 
                    strokeLinecap="round" 
                    className={`${isOverheating ? 'animate-pulse' : ''}`}
                    opacity={isOverheating ? "1" : "0.8"} 
                />

                {/* Ticks */}
                {Array.from({ length: 9 }).map((_, i) => {
                    const tickRPM = i * 1000;
                    const tickAngle = startAngle + (tickRPM / maxRPM) * totalAngle;
                    const p1 = polarToCartesian(cx, cy, radius - 20, tickAngle);
                    const p2 = polarToCartesian(cx, cy, radius - 30, tickAngle);
                    return (
                        <line 
                            key={i} 
                            x1={p1.x} y1={p1.y} 
                            x2={p2.x} y2={p2.y} 
                            stroke={i >= 7 ? "#ef4444" : "#94a3b8"} 
                            strokeWidth="2" 
                        />
                    );
                })}

                {/* Needle Group - controlled via style prop for spring animation */}
                <g style={needleStyle}>
                     <line x1={cx} y1={cy} x2={cx} y2={cy - radius + 10} stroke={isRedlining ? "#00FFD9" : "#ef4444"} strokeWidth="4" strokeLinecap="round" />
                     <circle cx={cx} cy={cy} r="8" fill="#0f172a" stroke={isRedlining ? "#00FFD9" : "#ef4444"} strokeWidth="2" />
                </g>
                
                {/* Gear Indicator */}
                <text x={cx} y={cy + 50} textAnchor="middle" className="fill-white font-mono text-4xl font-bold tracking-tighter">
                    {gear}
                </text>
                <text x={cx} y={cy + 70} textAnchor="middle" className="fill-slate-500 font-sans text-xs font-bold uppercase tracking-widest">
                    Gear
                </text>

                {/* Perfect Shift Overlay */}
                {showPerfectShift && (
                    <g className="animate-ping origin-center" style={{ transformOrigin: '150px 100px' }}>
                        <text x={cx} y={cy - 40} textAnchor="middle" className="fill-neon-cyan font-black text-lg tracking-widest italic drop-shadow-[0_0_5px_rgba(0,255,217,1)]">
                            PERFECT SHIFT!
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

export default Speedometer;