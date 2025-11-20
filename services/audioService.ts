import { CONFIG } from "../constants";

class AudioService {
    private ctx: AudioContext | null = null;
    private isInitialized = false;

    constructor() {
        // Lazy init to handle browser autoplay policies
    }

    public init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            this.isInitialized = true;
        } catch (e) {
            console.error("Audio init failed", e);
        }
    }

    public async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public playUpshift() {
        if (!this.ctx) return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // High to Low (Mechanical clunk/engaging)
        // Simulates the RPM dropping and the heavy gear thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);

        // Add a subtle noise burst for the mechanical "crunch"
        this.playNoiseBurst(t, 0.15, 600);
    }

    private playNoiseBurst(startTime: number, duration: number, freq: number) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(startTime);
    }

    public playDownshift() {
        if (!this.ctx) return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Low to High (Rev Match / Blip)
        // Simulates the engine spinning up to match the lower gear
        osc.type = 'triangle'; // Smoother than sawtooth for engine hum
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(350, t + 0.3);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    public playPerfectShift() {
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High pitched satisfying chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.1); // Sweep up to A6

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
    }
}

export const audioService = new AudioService();