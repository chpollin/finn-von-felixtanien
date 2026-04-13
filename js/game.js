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
import { DifficultyState } from './states/difficulty-state.js';

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
        this.difficulty = 'normal';
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
        this.states.set('difficulty', new DifficultyState());
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

    renderBackground(ctx, theme = 'forest') {
        const { width, height, camera } = this;

        if (theme === 'forest') {
            this.renderForestBg(ctx, width, height, camera);
        } else if (theme === 'sky') {
            this.renderSkyBg(ctx, width, height, camera);
        } else if (theme === 'lava') {
            this.renderLavaBg(ctx, width, height, camera);
        } else {
            this.renderDefaultBg(ctx, width, height, camera);
        }
    }

    renderDefaultBg(ctx, w, h, cam) {
        const offset = cam.x * 0.15;
        ctx.fillStyle = '#2a4a3a';
        for (let i = 0; i < 6; i++) {
            const hx = i * 200 - (offset % 200) - 100;
            const hh = 60 + Math.sin(i * 1.7) * 30;
            ctx.beginPath();
            ctx.moveTo(hx, h);
            ctx.quadraticCurveTo(hx + 100, h - hh, hx + 200, h);
            ctx.fill();
        }
    }

    renderForestBg(ctx, w, h, cam) {
        // Bodenlinie (wo Gras-Tiles beginnen — alles darüber ist Hintergrund)
        const groundY = h - 65;

        // Layer 1: Wolken (sehr langsam)
        const cloudOff = cam.x * 0.03;
        ctx.fillStyle = '#5a6a8a';
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 5; i++) {
            const cx = i * 220 - (cloudOff % 220) - 50;
            const cy = 50 + Math.sin(i * 2.1) * 25;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.arc(cx + 25, cy - 8, 24, 0, Math.PI * 2);
            ctx.arc(cx + 50, cy, 28, 0, Math.PI * 2);
            ctx.arc(cx + 20, cy + 5, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Layer 2: Ferne Berge
        const off1 = cam.x * 0.08;
        ctx.fillStyle = '#1a3a2a';
        for (let i = 0; i < 6; i++) {
            const hx = i * 200 - (off1 % 200) - 100;
            const hh = 100 + Math.sin(i * 1.7) * 40;
            ctx.beginPath();
            ctx.moveTo(hx, groundY);
            ctx.quadraticCurveTo(hx + 100, groundY - hh, hx + 200, groundY);
            ctx.fill();
        }

        // Layer 3: Ferne Bäume (Tannen-Silhouetten)
        const off2 = cam.x * 0.15;
        ctx.fillStyle = '#1a3828';
        for (let i = 0; i < 12; i++) {
            const tx = i * 100 - (off2 % 100) - 40;
            const th = 60 + Math.sin(i * 3.7) * 20;
            const by = groundY;
            ctx.fillRect(tx + 8, by - th + 15, 5, th - 15);
            ctx.beginPath();
            ctx.moveTo(tx - 2, by - th + 20);
            ctx.lineTo(tx + 11, by - th - 14);
            ctx.lineTo(tx + 24, by - th + 20);
            ctx.closePath();
            ctx.fill();
            // Zweite Krone-Ebene
            ctx.beginPath();
            ctx.moveTo(tx + 1, by - th + 30);
            ctx.lineTo(tx + 11, by - th + 5);
            ctx.lineTo(tx + 21, by - th + 30);
            ctx.closePath();
            ctx.fill();
        }

        // Layer 4: Nähere Hügel
        const off3 = cam.x * 0.25;
        ctx.fillStyle = '#2a4a2a';
        for (let i = 0; i < 5; i++) {
            const hx = i * 250 - (off3 % 250) - 125;
            const hh = 40 + Math.sin(i * 2.3 + 1) * 18;
            ctx.beginPath();
            ctx.moveTo(hx, groundY);
            ctx.quadraticCurveTo(hx + 125, groundY - hh, hx + 250, groundY);
            ctx.fill();
        }

        // Layer 5: Nahe Bäume (Laubbäume über der Bodenlinie)
        const off4 = cam.x * 0.35;
        for (let i = 0; i < 7; i++) {
            const tx = i * 180 - (off4 % 180) - 60;
            const th = 80 + Math.sin(i * 2.9 + 0.5) * 25;
            const by = groundY;

            // Stamm
            ctx.fillStyle = '#3a2a15';
            ctx.fillRect(tx + 12, by - th + 40, 10, th - 40);

            // Krone (Kreise, ÜBER der Bodenlinie)
            ctx.fillStyle = '#2a5a2a';
            ctx.beginPath();
            ctx.arc(tx + 17, by - th + 24, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2a6a2a';
            ctx.beginPath();
            ctx.arc(tx + 6, by - th + 34, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#336a33';
            ctx.beginPath();
            ctx.arc(tx + 28, by - th + 30, 15, 0, Math.PI * 2);
            ctx.fill();
            // Highlight oben
            ctx.fillStyle = '#3a7a3a';
            ctx.beginPath();
            ctx.arc(tx + 15, by - th + 18, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Layer 6: Büsche (knapp über Bodenlinie)
        const off5 = cam.x * 0.45;
        for (let i = 0; i < 8; i++) {
            const bx = i * 140 - (off5 % 140) - 30;
            const bw = 28 + Math.sin(i * 4.1) * 8;
            ctx.fillStyle = '#2a5a2a';
            ctx.beginPath();
            ctx.arc(bx, groundY, bw / 2, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#3a6a3a';
            ctx.beginPath();
            ctx.arc(bx + 3, groundY - 4, bw / 3, Math.PI, 0);
            ctx.fill();
        }

        // Next-Level-Hint: Höhleneingang am rechten Rand
        if (this.tilemap) {
            const hintX = this.tilemap.widthPx - 80 - cam.x * 0.4;
            if (hintX > w - 200 && hintX < w + 50) {
                ctx.fillStyle = '#1a1a2a';
                ctx.beginPath();
                ctx.arc(hintX, groundY, 35, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#0a0a14';
                ctx.beginPath();
                ctx.arc(hintX, groundY, 22, Math.PI, 0);
                ctx.fill();
            }
        }
    }

    renderSkyBg(ctx, w, h, cam) {
        // Wolken (groß, langsam)
        const cloudOff = cam.x * 0.05;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 6; i++) {
            const cx = i * 200 - (cloudOff % 200) - 50;
            const cy = 100 + Math.sin(i * 1.8) * 60;
            ctx.beginPath();
            ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            ctx.arc(cx + 35, cy - 10, 30, 0, Math.PI * 2);
            ctx.arc(cx + 60, cy, 35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ferne Berge (unten)
        const off1 = cam.x * 0.1;
        ctx.fillStyle = '#6a8aaa';
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 6; i++) {
            const hx = i * 200 - (off1 % 200) - 100;
            const hh = 40 + Math.sin(i * 1.5) * 20;
            ctx.beginPath();
            ctx.moveTo(hx, h);
            ctx.quadraticCurveTo(hx + 100, h - hh, hx + 200, h);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderLavaBg(ctx, w, h, cam) {
        // Rauch-Wolken
        const smokeOff = cam.x * 0.06;
        ctx.fillStyle = '#4a2a1a';
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 5; i++) {
            const cx = i * 240 - (smokeOff % 240) - 60;
            const cy = 80 + Math.sin(i * 1.9) * 40;
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.arc(cx + 40, cy + 5, 28, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Vulkan-Silhouetten
        const off1 = cam.x * 0.12;
        ctx.fillStyle = '#2a1008';
        for (let i = 0; i < 4; i++) {
            const vx = i * 300 - (off1 % 300) - 100;
            const vh = 90 + Math.sin(i * 2.1) * 30;
            ctx.beginPath();
            ctx.moveTo(vx, h);
            ctx.lineTo(vx + 80, h - vh);
            ctx.lineTo(vx + 100, h - vh + 10);
            ctx.lineTo(vx + 120, h - vh);
            ctx.lineTo(vx + 200, h);
            ctx.closePath();
            ctx.fill();
        }

        // Lava-Glühen unten
        ctx.fillStyle = '#ff440044';
        ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 500) * 0.05;
        ctx.fillRect(0, h - 60, w, 60);
        ctx.globalAlpha = 1;
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
