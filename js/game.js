import { Input } from './input.js';

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
        this.lastTime = 0;
        this.running = false;

        // FPS-Tracking
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentFps = 0;

        // UI-Referenzen
        this.scoreEl = document.getElementById('score');
        this.fpsEl = document.getElementById('fps');
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = (timestamp - this.lastTime) / 1000; // Delta in Sekunden
        this.lastTime = timestamp;

        // FPS berechnen
        this.frameCount++;
        this.fpsTime += dt;
        if (this.fpsTime >= 1) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // --- Game-Logik hier ---

        // Entities updaten
        for (const entity of this.entities) {
            entity.update(dt, this);
        }

        // Tote Entities entfernen
        this.entities = this.entities.filter(e => e.alive !== false);

        // UI updaten
        this.scoreEl.textContent = `Score: ${this.score}`;
        this.fpsEl.textContent = `${this.currentFps} FPS`;
    }

    render() {
        const { ctx, width, height } = this;

        // Hintergrund
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Entities zeichnen
        for (const entity of this.entities) {
            entity.render(ctx);
        }

        // Platzhalter-Text
        if (this.entities.length === 0) {
            ctx.fillStyle = '#444';
            ctx.font = '24px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game bereit — jetzt Spiellogik einbauen!', width / 2, height / 2);
            ctx.font = '14px "Segoe UI", system-ui, sans-serif';
            ctx.fillText('Öffne js/game.js um loszulegen', width / 2, height / 2 + 35);
            ctx.textAlign = 'start';
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }
}
