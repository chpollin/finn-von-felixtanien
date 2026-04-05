import { Entity } from '../entity.js';

export class Door extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 32;
        this.height = 48;
        this.timer = 0;
        this.activated = false;
    }

    update(dt, game) {
        this.timer += dt;
        if (game.player && this.collidesWith(game.player) && !this.activated) {
            this.activated = true;
            // Nächstes Level laden
            const next = game.currentLevel + 1;
            const playingState = game.states.get('playing');
            if (playingState && playingState.loadLevel) {
                // Elemente vom Spieler retten
                const savedElements = new Set(game.player.elements);
                const savedActive = game.player.activeElement;
                const savedScore = game.score;

                playingState.loadLevel(game, next);
                game.score = savedScore;

                // Elemente wiederherstellen
                if (game.player) {
                    game.player.elements = savedElements;
                    game.player.activeElement = savedActive;
                }
            }
        }
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const glow = 0.5 + Math.sin(this.timer * 3) * 0.2;

        // Portal-Glow
        ctx.globalAlpha = glow * 0.3;
        ctx.fillStyle = '#88f';
        ctx.fillRect(x - 6, y - 6, this.width + 12, this.height + 12);

        ctx.globalAlpha = 1;
        // Rahmen (Stein)
        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, 4, this.height);
        ctx.fillRect(x + this.width - 4, y, 4, this.height);
        ctx.fillRect(x, y, this.width, 4);

        // Portal-Inneres
        ctx.fillStyle = `rgba(100, 100, 255, ${glow})`;
        ctx.fillRect(x + 4, y + 4, this.width - 8, this.height - 4);

        // Partikel-Effekt
        ctx.fillStyle = '#aaf';
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
            const py = y + this.height - ((this.timer * 40 + i * 12) % this.height);
            const px = x + 8 + Math.sin(this.timer * 2 + i * 2) * 6;
            ctx.fillRect(px, py, 3, 3);
        }
        ctx.globalAlpha = 1;
    }
}
