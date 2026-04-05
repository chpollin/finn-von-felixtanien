import { Entity } from '../entity.js';

export class Sign extends Entity {
    constructor(x, y, text) {
        super(x, y);
        this.width = 24;
        this.height = 32;
        this.text = text;
        this.showText = false;
    }

    update(dt, game) {
        if (!game.player) return;
        const dx = Math.abs((this.x + this.width / 2) - (game.player.x + game.player.width / 2));
        const dy = Math.abs((this.y + this.height / 2) - (game.player.y + game.player.height / 2));
        this.showText = dx < 50 && dy < 50;
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);

        // Pfahl
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(x + 10, y + 16, 4, 16);

        // Schild
        ctx.fillStyle = '#a08050';
        ctx.fillRect(x, y, 24, 18);
        ctx.fillStyle = '#8a6a40';
        ctx.strokeStyle = '#6b4a2a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 24, 18);

        // Text-Bubble
        if (this.showText) {
            const lines = this.text.split('\n');
            const maxW = lines.reduce((m, l) => Math.max(m, l.length * 7), 0);
            const bw = maxW + 16;
            const bh = lines.length * 16 + 12;
            const bx = x + 12 - bw / 2;
            const by = y - bh - 8;

            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = '#888';
            ctx.strokeRect(bx, by, bw, bh);

            ctx.fillStyle = '#fff';
            ctx.font = '12px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], x + 12, by + 16 + i * 16);
            }
            ctx.textAlign = 'start';
        }
    }
}
