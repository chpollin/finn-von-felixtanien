import { Entity } from '../entity.js';

/**
 * Falsche Prinzessin — sieht aus wie Lea, entpuppt sich als verkleideter Ork!
 * Plottwist nach dem Boss-Kampf in Level 6.
 */
export class FakePrincess extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 24;
        this.height = 44;
        this.timer = 0;
        this.phase = 'disguise'; // disguise → reveal → laugh → flee
        this.revealTimer = 0;
        this.laughTimer = 0;
        this.triggered = false;
        this.fleeDir = 0;
    }

    update(dt, game) {
        this.timer += dt;

        switch (this.phase) {
            case 'disguise':
                // Sieht aus wie Lea, wartet auf Spieler
                if (game.player && this.collidesWith(game.player) && !this.triggered) {
                    this.triggered = true;
                    this.phase = 'reveal';
                    this.revealTimer = 2.5;
                    if (game.screenFx) game.screenFx.shake(8, 0.5);
                    if (game.screenFx) game.screenFx.flash('#ff0000', 0.3);
                    if (game.audio) game.audio.play('hurt');
                    if (game.particles) {
                        game.particles.emit(this.x + 12, this.y + 22, 25, {
                            color: '#aa44aa', speed: 120, life: 0.8, size: 5
                        });
                        game.particles.showDamage(this.x + 12, this.y - 30, 'PLOTTWIST!', '#ff44ff');
                    }
                }
                break;

            case 'reveal':
                this.revealTimer -= dt;
                // Morphing-Partikel
                if (Math.random() > 0.7 && game.particles) {
                    game.particles.emit(this.x + 12, this.y + 22, 2, {
                        color: '#aa44aa', speed: 40, life: 0.4, size: 3
                    });
                }
                if (this.revealTimer <= 0) {
                    this.phase = 'laugh';
                    this.laughTimer = 3;
                    if (game.particles) {
                        game.particles.showDamage(this.x + 12, this.y - 40, 'HAHAHAHA!', '#ff4444');
                    }
                }
                break;

            case 'laugh':
                this.laughTimer -= dt;
                if (this.laughTimer <= 0) {
                    this.phase = 'flee';
                    this.fleeDir = game.player ? (this.x > game.player.x ? 1 : -1) : 1;
                    // Bonus-Level auslösen!
                    if (game.particles) {
                        game.particles.showDamage(this.x + 12, this.y - 20, 'Lea ist woanders!', '#ffaa00');
                    }
                    // Nach kurzem Delay Bonus-Level laden
                    this._bonusTimer = 2;
                }
                break;

            case 'flee':
                this.x += this.fleeDir * 300 * dt;
                this.y -= 50 * dt;
                this._bonusTimer -= dt;
                if (this._bonusTimer <= 0) {
                    // Bonus-Level starten
                    const playingState = game.states.get('playing');
                    if (playingState) {
                        playingState.loadLevel(game, game.currentLevel + 1);
                    }
                    this.destroy();
                }
                break;
        }
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const bounce = Math.sin(this.timer * 2) * 2;

        if (this.phase === 'disguise') {
            // Sieht aus wie echte Prinzessin Lea
            this.renderAsLea(ctx, x, y, bounce);
        } else if (this.phase === 'reveal') {
            // Morphing! Halb Lea, halb Ork
            const progress = 1 - (this.revealTimer / 2.5);
            if (Math.sin(this.timer * 20) > 0) {
                this.renderAsLea(ctx, x, y, bounce);
            } else {
                this.renderAsOrc(ctx, x, y);
            }
            // Lila Glow
            ctx.fillStyle = `rgba(170, 68, 170, ${0.3 * progress})`;
            ctx.beginPath();
            ctx.arc(x + 12, y + 22, 30, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ork-Form
            this.renderAsOrc(ctx, x, y);
            // Sprechblase
            this.renderSpeech(ctx, x, y);
        }
    }

    renderAsLea(ctx, x, y, bounce = 0) {
        // Gleicher Code wie echte Princess
        ctx.fillStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.beginPath();
        ctx.arc(x + 12, y + 22 + bounce, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d070a0';
        ctx.fillRect(x + 2, y + 18 + bounce, 20, 24);
        ctx.fillStyle = '#c06090';
        ctx.fillRect(x, y + 34 + bounce, 24, 10);
        ctx.fillStyle = '#e080b0';
        ctx.fillRect(x + 4, y + 14 + bounce, 16, 8);
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 1, y + 16 + bounce, 4, 10);
        ctx.fillRect(x + 19, y + 16 + bounce, 4, 10);
        ctx.fillRect(x + 5, y + 4 + bounce, 14, 12);
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(x + 4, y + bounce, 16, 8);
        ctx.fillRect(x + 3, y + 6 + bounce, 4, 20);
        ctx.fillRect(x + 17, y + 6 + bounce, 4, 20);
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(x + 6, y - 4 + bounce, 12, 5);
        ctx.fillRect(x + 7, y - 7 + bounce, 3, 3);
        ctx.fillRect(x + 11, y - 8 + bounce, 3, 4);
        ctx.fillRect(x + 15, y - 7 + bounce, 3, 3);
        ctx.fillStyle = '#2a6';
        ctx.fillRect(x + 8, y + 8 + bounce, 3, 2);
        ctx.fillRect(x + 14, y + 8 + bounce, 3, 2);
        ctx.fillStyle = '#c06070';
        ctx.fillRect(x + 9, y + 12 + bounce, 6, 1);
    }

    renderAsOrc(ctx, x, y) {
        // Kleiner fieser Ork in Kleid-Fetzen
        // Körper (grün)
        ctx.fillStyle = '#5a7a4a';
        ctx.fillRect(x + 2, y + 14, 20, 18);
        // Zerrissenes rosa Kleid
        ctx.fillStyle = '#d070a0';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 1, y + 20, 22, 14);
        ctx.globalAlpha = 1;
        // Beine
        ctx.fillStyle = '#4a6a3a';
        ctx.fillRect(x + 4, y + 30, 7, 12);
        ctx.fillRect(x + 14, y + 30, 7, 12);
        // Kopf (Schweinekopf)
        ctx.fillStyle = '#d4967a';
        ctx.fillRect(x + 3, y, 18, 16);
        // Falsche Perücke (halb ab)
        ctx.fillStyle = '#e8c44a';
        ctx.fillRect(x + 10, y - 2, 12, 8);
        // Schnauze
        ctx.fillStyle = '#e0a88e';
        ctx.fillRect(x + 6, y + 8, 10, 6);
        ctx.fillStyle = '#8a5040';
        ctx.fillRect(x + 8, y + 10, 2, 2);
        ctx.fillRect(x + 13, y + 10, 2, 2);
        // Böse Augen
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(x + 5, y + 4, 3, 3);
        ctx.fillRect(x + 15, y + 4, 3, 3);
        // Fieses Grinsen
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(x + 7, y + 13, 8, 2);
        ctx.fillStyle = '#ffe';
        ctx.fillRect(x + 8, y + 12, 2, 3);
        ctx.fillRect(x + 14, y + 12, 2, 3);
    }

    renderSpeech(ctx, x, y) {
        const texts = {
            'laugh': 'HAHAHA!\nDas war zu einfach!\nIch bin gar nicht Lea!',
            'flee': 'Die ECHTE Lea\nist im Kerker!\nTschüüüss!',
        };
        const text = texts[this.phase];
        if (!text) return;

        const lines = text.split('\n');
        const bw = 160;
        const bh = lines.length * 16 + 14;
        const bx = x + 12 - bw / 2;
        const by = y - bh - 16;

        ctx.fillStyle = 'rgba(80, 20, 20, 0.9)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#ff8888';
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + 12, by + 16 + i * 16);
        }
        ctx.textAlign = 'start';
    }
}
