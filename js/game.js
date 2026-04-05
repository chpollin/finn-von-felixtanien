import { Input } from './input.js';
import { Camera } from './camera.js';
import { ParticleSystem } from './effects.js';
import { AudioManager } from './audio.js';
import { ScreenEffects } from './ui/screen-effects.js';
import { TitleState } from './states/title-state.js';
import { PlayingState } from './states/playing-state.js';
import { PauseState } from './states/pause-state.js';
import { GameOverState } from './states/gameover-state.js';
import { VictoryState } from './states/victory-state.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = new Input(canvas);

        // Interne Auflösung
        this.width = 800;
        this.height = 600;
        canvas.width = this.width;
        canvas.height = this.height;

        this.score = 0;
        this.entities = [];
        this.player = null;
        this.tilemap = null;
        this.levelStart = { x: 0, y: 0 };
        this.currentLevel = 0;
        this.lastTime = 0;
        this.running = false;

        // Kamera
        this.camera = new Camera(this.width, this.height);

        // Partikel
        this.particles = new ParticleSystem();

        // Audio
        this.audio = new AudioManager();

        // Screen-Effekte
        this.screenFx = new ScreenEffects();

        // FPS-Tracking
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentFps = 0;

        // UI-Referenzen
        this.scoreEl = document.getElementById('score');
        this.fpsEl = document.getElementById('fps');

        // States
        this.states = new Map();
        this.states.set('title', new TitleState());
        this.states.set('playing', new PlayingState());
        this.states.set('pause', new PauseState());
        this.states.set('gameover', new GameOverState());
        this.states.set('victory', new VictoryState());
        this.currentState = null;
        this.currentStateName = null;
    }

    setState(name) {
        // "playing-resume" = zurück zum Playing-State ohne Reset
        if (name === 'playing-resume') {
            if (this.currentState) this.currentState.exit(this);
            this.currentStateName = 'playing';
            this.currentState = this.states.get('playing');
            // Kein enter() aufrufen = kein Level-Reset
            return;
        }

        const state = this.states.get(name);
        if (!state) return;

        if (this.currentState) this.currentState.exit(this);
        this.currentStateName = name;
        this.currentState = state;
        state.enter(this);
    }

    start() {
        this.running = true;
        this.setState('title');
        this.lastTime = performance.now();

        // Audio bei erster Interaktion initialisieren
        const initAudio = () => {
            this.audio.init();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);

        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        // FPS berechnen
        this.frameCount++;
        this.fpsTime += dt;
        if (this.fpsTime >= 1) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        // Mute-Toggle
        if (this.input.justPressed('KeyM')) {
            this.audio.toggleMute();
        }

        // Screen-Effekte
        this.screenFx.update(dt);

        // State update & render
        if (this.currentState) {
            this.currentState.update(dt, this);
            this.ctx.save();
            this.screenFx.applyShake(this.ctx);
            this.currentState.render(this.ctx, this);
            this.ctx.restore();

            // Screen-Flash und Vignette
            this.screenFx.renderFlash(this.ctx, this.width, this.height);
            if (this.player) {
                this.screenFx.renderVignette(this.ctx, this.width, this.height, this.player.health / this.player.maxHealth);
            }
        }

        // Input-Frame beenden (für justPressed)
        this.input.endFrame();

        requestAnimationFrame((t) => this.loop(t));
    }

    renderBackground(ctx) {
        const { width, height, camera } = this;
        const parallax = 0.15;
        const offset = camera.x * parallax;

        ctx.fillStyle = '#2a4a3a';
        for (let i = 0; i < 6; i++) {
            const hx = i * 200 - (offset % 200) - 100;
            const hh = 60 + Math.sin(i * 1.7) * 30;
            ctx.beginPath();
            ctx.moveTo(hx, height);
            ctx.quadraticCurveTo(hx + 100, height - hh, hx + 200, height);
            ctx.fill();
        }

        ctx.fillStyle = '#1a3a2a';
        const offset2 = camera.x * 0.3;
        for (let i = 0; i < 5; i++) {
            const hx = i * 250 - (offset2 % 250) - 125;
            const hh = 40 + Math.sin(i * 2.3 + 1) * 20;
            ctx.beginPath();
            ctx.moveTo(hx, height);
            ctx.quadraticCurveTo(hx + 125, height - hh, hx + 250, height);
            ctx.fill();
        }
    }

    renderHUD(ctx) {
        if (!this.player) return;
        const p = this.player;

        // HP-Balken Hintergrund
        ctx.fillStyle = '#333';
        ctx.fillRect(16, 36, 104, 14);

        // HP-Balken
        const hpRatio = p.health / p.maxHealth;
        const hpColor = hpRatio > 0.5 ? '#3a8' : hpRatio > 0.25 ? '#da3' : '#d33';
        ctx.fillStyle = hpColor;
        ctx.fillRect(18, 38, 100 * hpRatio, 10);

        // Rahmen
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(16, 36, 104, 14);

        // HP-Text
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.health} / ${p.maxHealth}`, 68, 47);
        ctx.textAlign = 'start';
    }

    addEntity(entity) {
        this.entities.push(entity);
    }
}
