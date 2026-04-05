import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcDark extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.DARK;
        this.health = 70;
        this.maxHealth = 70;
        this.damage = 16;
        this.speed = 60;
        this.chaseSpeed = 110;
        this.sightRange = 190;
        this.animTimer = 0;
        // Unsichtbarkeits-Mechanik
        this.fadeTimer = 0;
        this.fadeInterval = 3;
        this.fadeDuration = 1.2;
        this.faded = false;
    }

    update(dt, game) {
        super.update(dt, game);
        this.animTimer += dt * 5;
        // Periodisch unsichtbar
        this.fadeTimer += dt;
        if (!this.faded && this.fadeTimer >= this.fadeInterval) {
            this.faded = true;
            this.fadeTimer = 0;
        }
        if (this.faded && this.fadeTimer >= this.fadeDuration) {
            this.faded = false;
            this.fadeTimer = 0;
        }
    }

    render(ctx) {
        if (this.aiState === STATE.DEAD) ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        else if (this.faded) ctx.globalAlpha = 0.15;
        if (this.invincible && this.aiState !== STATE.DEAD && Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 3 : 0;

        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);
        ctx.fillStyle = '#3a2a4a';
        ctx.fillRect(x + 2, y + 14, 26, 16);
        ctx.fillStyle = '#4a3a5a';
        ctx.fillRect(x + 8, y + 18, 14, 10);
        // Schatten-Aura
        ctx.fillStyle = '#6600aa';
        ctx.globalAlpha = Math.max(ctx.globalAlpha, 0) * (0.2 + Math.sin(this.animTimer * 2) * 0.1);
        ctx.beginPath(); ctx.arc(x + 15, y + 20, 20, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = this.faded ? 0.15 : 1;
        // Kopf
        ctx.fillStyle = '#6a5070';
        ctx.fillRect(x + 4, y, 22, 16);
        ctx.fillStyle = '#5a4060';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y + 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x + 23, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7a6080';
        ctx.fillRect(x + 9, y + 8, 12, 7);
        ctx.fillStyle = '#3a2040';
        ctx.fillRect(x + 11, y + 10, 3, 3);
        ctx.fillRect(x + 17, y + 10, 3, 3);
        // Augen (lila leuchtend)
        ctx.fillStyle = '#cc66ff';
        ctx.fillRect(x + 7, y + 4, 4, 4);
        ctx.fillRect(x + 19, y + 4, 4, 4);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
