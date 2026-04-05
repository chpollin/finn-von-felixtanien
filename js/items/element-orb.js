import { Entity } from '../entity.js';
import { getElementColor, getElementGlow, getElementName } from '../elements.js';

export class ElementOrb extends Entity {
    constructor(x, y, element) {
        super(x, y);
        this.width = 20;
        this.height = 20;
        this.element = element;
        this.baseY = y;
        this.timer = Math.random() * Math.PI * 2;
    }

    update(dt, game) {
        this.timer += dt * 3;
        // Schwebe-Animation
        this.y = this.baseY + Math.sin(this.timer) * 6;

        // Einsammeln bei Kontakt mit Spieler
        if (game.player && this.collidesWith(game.player)) {
            game.player.addElement(this.element);
            if (game.audio) game.audio.play('pickup');
            if (game.particles) {
                game.particles.emit(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    20,
                    { color: getElementColor(this.element), speed: 120, life: 0.6, size: 4 }
                );
                game.particles.showDamage(
                    this.x + this.width / 2,
                    this.y - 16,
                    getElementName(this.element) + '!',
                    getElementGlow(this.element)
                );
            }
            this.destroy();
        }
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const color = getElementColor(this.element);
        const glow = getElementGlow(this.element);
        const pulse = 1 + Math.sin(this.timer * 2) * 0.15;
        const r = 9 * pulse;

        // Glow-Aura
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.fill();

        // Kugel
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
