import { Entity } from '../entity.js';

export class Princess extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 24;
        this.height = 44;
        this.timer = 0;
        this.rescued = false;
    }

    update(dt, game) {
        this.timer += dt;

        // Victory-Timer (sicher, ohne setTimeout)
        if (this._victoryTimer > 0) {
            this._victoryTimer -= dt;
            if (this._victoryTimer <= 0 && game.player && game.player.health > 0) {
                game.setState('victory');
            }
        }

        if (game.player && this.collidesWith(game.player) && !this.rescued) {
            this.rescued = true;
            game.score += 500;
            if (game.particles) {
                game.particles.emit(this.x + 12, this.y + 22, 30, {
                    color: '#ffcc00', speed: 150, life: 1, size: 4
                });
            }
            // Kurze Verzögerung, dann Victory (nur wenn Spieler noch lebt)
            this._victoryTimer = 1.5;
            this._game = game;
        }
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const bounce = Math.sin(this.timer * 2) * 2;

        // Glow
        ctx.fillStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.beginPath();
        ctx.arc(x + 12, y + 22 + bounce, 30, 0, Math.PI * 2);
        ctx.fill();

        // Kleid (rosa/magenta)
        ctx.fillStyle = '#d070a0';
        ctx.fillRect(x + 2, y + 18 + bounce, 20, 24);
        // Kleid unten (weiter)
        ctx.fillStyle = '#c06090';
        ctx.fillRect(x, y + 34 + bounce, 24, 10);

        // Oberkörper
        ctx.fillStyle = '#e080b0';
        ctx.fillRect(x + 4, y + 14 + bounce, 16, 8);

        // Arme
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 1, y + 16 + bounce, 4, 10);
        ctx.fillRect(x + 19, y + 16 + bounce, 4, 10);

        // Kopf
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 5, y + 4 + bounce, 14, 12);

        // Haare (blond, lang)
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(x + 4, y + bounce, 16, 8);
        ctx.fillRect(x + 3, y + 6 + bounce, 4, 20);
        ctx.fillRect(x + 17, y + 6 + bounce, 4, 20);

        // Krone
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(x + 6, y - 4 + bounce, 12, 5);
        ctx.fillRect(x + 7, y - 7 + bounce, 3, 3);
        ctx.fillRect(x + 11, y - 8 + bounce, 3, 4);
        ctx.fillRect(x + 15, y - 7 + bounce, 3, 3);
        // Edelstein
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(x + 11, y - 3 + bounce, 3, 3);

        // Augen (fröhlich — Bögen)
        ctx.fillStyle = '#2a6';
        ctx.fillRect(x + 8, y + 8 + bounce, 3, 2);
        ctx.fillRect(x + 14, y + 8 + bounce, 3, 2);

        // Lächeln
        ctx.fillStyle = '#c06070';
        ctx.fillRect(x + 9, y + 12 + bounce, 6, 1);
        ctx.fillRect(x + 10, y + 13 + bounce, 4, 1);

        // Schuhe
        ctx.fillStyle = '#d070a0';
        ctx.fillRect(x + 2, y + 42 + bounce, 8, 3);
        ctx.fillRect(x + 14, y + 42 + bounce, 8, 3);
    }
}
