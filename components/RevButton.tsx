import React from 'react';

interface RevButtonProps {
    onRev: () => void;
    disabled?: boolean;
}

const RevButton: React.FC<RevButtonProps> = ({ onRev, disabled }) => {
    const handleClick = () => {
        if (disabled) return;
        
        // Haptic feedback attempt for web
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        onRev();
    };

    return (
        <button
            onClick={handleClick}
            className={`
                relative w-48 h-48 rounded-full 
                bg-gradient-to-br from-red-500 to-red-700
                shadow-[0_0_30px_rgba(239,68,68,0.4)]
                border-8 border-slate-900 ring-4 ring-slate-800
                flex flex-col items-center justify-center
                transition-transform active:scale-95
                group
                mx-auto my-8
                select-none touch-manipulation
            `}
        >
            <div className="absolute inset-0 rounded-full bg-black opacity-0 group-active:opacity-10 transition-opacity" />
            <span className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md">
                REV
            </span>
            <span className="text-xs font-mono text-red-200 mt-1 opacity-70">
                TAP TO BUILD RPM
            </span>
        </button>
    );
};

export default RevButton;
