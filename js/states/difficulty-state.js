import { GameState } from './state.js';
import { DIFFICULTY_PRESETS } from '../difficulty.js';

const DIFFICULTY_KEYS = ['leicht', 'normal', 'schwer'];

export class DifficultyState extends GameState {
    constructor() {
        super();
        this.selected = 1; // Normal vorausgewählt
        this.blinkTimer = 0;
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: 1 + Math.random() * 2,
                speed: 0.3 + Math.random() * 0.7,
            });
        }
    }

    enter(game) {
        this.selected = 1; // Normal vorausgewählt
        this.blinkTimer = 0;
    }

    update(dt, game) {
        this.blinkTimer += dt;

        if (game.input.justPressed('ArrowUp') || game.input.justPressed('KeyW')) {
            this.selected = (this.selected - 1 + 3) % 3;
        }
        if (game.input.justPressed('ArrowDown') || game.input.justPressed('KeyS')) {
            this.selected = (this.selected + 1) % 3;
        }

        if (game.input.justPressed('Enter') || game.input.justPressed('Space')) {
            game.difficulty = DIFFICULTY_KEYS[this.selected];
            game.setState('playing');
        }

        // Zurück zum Titel
        if (game.input.justPressed('Escape')) {
            game.setState('title');
        }
    }

    render(ctx, game) {
        const w = game.width;
        const h = game.height;

        // Dunkler Hintergrund (wie TitleState)
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1e');
        grad.addColorStop(1, '#1a1a3e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Sterne
        for (const s of this.stars) {
            const alpha = 0.3 + Math.sin(this.blinkTimer * s.speed * 3) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;

        // Schloss-Silhouette (subtil)
        ctx.fillStyle = '#111128';
        ctx.fillRect(310, 380, 180, 120);
        ctx.fillRect(290, 340, 30, 160);
        ctx.fillRect(480, 340, 30, 160);
        ctx.fillRect(375, 320, 50, 180);
        ctx.beginPath();
        ctx.moveTo(290, 340); ctx.lineTo(305, 310); ctx.lineTo(320, 340);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(480, 340); ctx.lineTo(495, 310); ctx.lineTo(510, 340);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(375, 320); ctx.lineTo(400, 285); ctx.lineTo(425, 320);
        ctx.fill();

        // Titel
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#e8c44a';
        ctx.fillText('Schwierigkeit wählen', w / 2, 100);

        // Optionen
        for (let i = 0; i < 3; i++) {
            const key = DIFFICULTY_KEYS[i];
            const preset = DIFFICULTY_PRESETS[key];
            const isSelected = i === this.selected;
            const y = 200 + i * 90;

            // Hintergrund-Highlight für ausgewählte Option
            if (isSelected) {
                ctx.fillStyle = 'rgba(232, 196, 74, 0.08)';
                ctx.fillRect(w / 2 - 200, y - 25, 400, 65);
            }

            // Label
            ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = isSelected ? preset.color : '#555';
            const prefix = isSelected ? '► ' : '  ';
            ctx.fillText(prefix + preset.label, w / 2, y);

            // Beschreibung
            ctx.font = '14px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = isSelected ? '#8a9aaa' : '#444';
            ctx.fillText(preset.description, w / 2, y + 24);
        }

        // Hinweis unten
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#556';
        const blink = Math.sin(this.blinkTimer * 3) > 0;
        if (blink) {
            ctx.fillText('ENTER = Auswählen  |  ESC = Zurück', w / 2, h - 40);
        }

        ctx.textAlign = 'start';
    }
}
