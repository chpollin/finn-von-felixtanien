import { GameState } from './state.js';

export class VictoryState extends GameState {
    constructor() {
        super();
        this.timer = 0;
    }

    enter(game) {
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;

        if (this.timer > 2 && (game.input.justPressed('Enter') || game.input.justPressed('Space'))) {
            game.setState('title');
        }
    }

    render(ctx, game) {
        const w = game.width;
        const h = game.height;

        // Gold-Hintergrund
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#2a2a3e');
        grad.addColorStop(1, '#1a2a1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Sterne
        ctx.fillStyle = '#ff8';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137 + this.timer * 20 * (i % 3 + 1)) % w;
            const sy = (i * 89) % (h / 2);
            const alpha = 0.3 + Math.sin(this.timer * 2 + i) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.globalAlpha = 1;

        const textAlpha = Math.min(1, this.timer / 1.5);
        ctx.globalAlpha = textAlpha;

        ctx.textAlign = 'center';

        // Finn + Lea Silhouetten
        const centerY = 350;
        // Finn
        ctx.fillStyle = '#2a4a8a';
        ctx.fillRect(340, centerY, 20, 48);
        ctx.fillRect(338, centerY - 12, 24, 16);
        ctx.fillStyle = '#aa2200';
        ctx.fillRect(358, centerY - 20, 3, 40);

        // Lea
        ctx.fillStyle = '#d070a0';
        ctx.fillRect(420, centerY, 24, 48);
        ctx.fillRect(420, centerY - 12, 24, 16);
        // Krone
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(422, centerY - 18, 20, 6);
        ctx.fillRect(424, centerY - 22, 4, 4);
        ctx.fillRect(432, centerY - 22, 4, 4);
        ctx.fillRect(440, centerY - 22, 0, 0);

        // Titel
        ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#e8c44a';
        ctx.fillText('Prinzessin Lea ist gerettet!', w / 2, 120);

        // Score
        ctx.font = '26px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${game.score}`, w / 2, 180);

        // Story
        ctx.font = '18px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#a8b8d0';
        ctx.fillText('Finn hat Ganondorf besiegt und Felixtanien gerettet!', w / 2, 230);
        ctx.fillText('Frieden kehrt zurück ins Königreich.', w / 2, 260);

        // Zurück-Hinweis
        if (this.timer > 2) {
            const blink = Math.sin(this.timer * 3) > 0;
            if (blink) {
                ctx.font = '18px "Segoe UI", system-ui, sans-serif';
                ctx.fillStyle = '#888';
                ctx.fillText('Drücke ENTER', w / 2, 500);
            }
        }

        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
    }
}
