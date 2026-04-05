export class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.3;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            // Audio nicht verfügbar
        }
    }

    toggleMute() {
        this.muted = !this.muted;
    }

    play(type) {
        if (this.muted || !this.ctx) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (type) {
            case 'slash': this.playSlash(); break;
            case 'hit': this.playHit(); break;
            case 'jump': this.playJump(); break;
            case 'pickup': this.playPickup(); break;
            case 'hurt': this.playHurt(); break;
            case 'kill': this.playKill(); break;
            case 'select': this.playSelect(); break;
        }
    }

    createOsc(freq, duration, type = 'square', vol = null) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = (vol !== null ? vol : this.volume) * 0.5;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSlash() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playHit() {
        this.createOsc(150, 0.15, 'square');
        this.createOsc(80, 0.1, 'sawtooth');
    }

    playJump() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playPickup() {
        const t = this.ctx.currentTime;
        [523, 659, 784].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.3, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    }

    playHurt() {
        this.createOsc(200, 0.2, 'sawtooth');
        this.createOsc(100, 0.15, 'square');
    }

    playKill() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playSelect() {
        this.createOsc(440, 0.08, 'sine');
    }
}
