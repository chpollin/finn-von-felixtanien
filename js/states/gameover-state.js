import { GameState } from './state.js';

export class GameOverState extends GameState {
    constructor() {
        super();
        this.fadeTimer = 0;
        this.selected = 0;
    }

    enter(game) {
        this.fadeTimer = 0;
        this.selected = 0;
    }

    update(dt, game) {
        this.fadeTimer = Math.min(this.fadeTimer + dt, 1.5);

        if (this.fadeTimer >= 1) {
            if (game.input.justPressed('ArrowUp') || game.input.justPressed('KeyW')) {
                this.selected = (this.selected - 1 + 2) % 2;
            }
            if (game.input.justPressed('ArrowDown') || game.input.justPressed('KeyS')) {
                this.selected = (this.selected + 1) % 2;
            }
            if (game.input.justPressed('Enter') || game.input.justPressed('Space')) {
                if (this.selected === 0) game.setState('playing');
                else game.setState('title');
            }
        }
    }

    render(ctx, game) {
        const w = game.width;
        const h = game.height;
        const alpha = Math.min(1, this.fadeTimer / 1);

        // Roter Hintergrund
        ctx.fillStyle = `rgba(30, 5, 5, ${alpha * 0.9})`;
        ctx.fillRect(0, 0, w, h);

        if (this.fadeTimer < 0.5) return;
        const textAlpha = Math.min(1, (this.fadeTimer - 0.5) / 0.5);
        ctx.globalAlpha = textAlpha;

        ctx.textAlign = 'center';

        // Game Over
        ctx.font = 'bold 50px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#cc2222';
        ctx.fillText('GAME OVER', w / 2, 200);

        // Score
        ctx.font = '24px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Score: ${game.score}`, w / 2, 260);

        // Story-Text
        ctx.font = '16px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('Ganondorf lacht... Felixtanien braucht seinen König!', w / 2, 310);

        // Optionen
        if (this.fadeTimer >= 1) {
            ctx.font = '22px "Segoe UI", system-ui, sans-serif';
            const opts = ['Nochmal', 'Hauptmenü'];
            for (let i = 0; i < opts.length; i++) {
                ctx.fillStyle = i === this.selected ? '#e8c44a' : '#888';
                const prefix = i === this.selected ? '► ' : '  ';
                ctx.fillText(prefix + opts[i], w / 2, 400 + i * 45);
            }
        }

        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
    }
}
