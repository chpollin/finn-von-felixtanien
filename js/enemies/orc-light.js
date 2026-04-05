import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcLight extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.LIGHT;
        this.health = 65;
        this.maxHealth = 65;
        this.damage = 14;
        this.speed = 55;
        this.chaseSpeed = 100;
        this.sightRange = 180;
        this.animTimer = 0;
    }

    update(dt, game) { super.update(dt, game); this.animTimer += dt * 5; }

    render(ctx) {
        if (this.aiState === STATE.DEAD) ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        if (this.invincible && this.aiState !== STATE.DEAD && Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 3 : 0;

        ctx.fillStyle = '#8a8a40';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);
        ctx.fillStyle = '#ccbb44';
        ctx.fillRect(x + 2, y + 14, 26, 16);
        ctx.fillStyle = '#ddcc66';
        ctx.fillRect(x + 8, y + 18, 14, 10);
        // Licht-Glow
        ctx.fillStyle = '#ffee00';
        ctx.globalAlpha = 0.15 + Math.sin(this.animTimer * 3) * 0.05;
        ctx.beginPath(); ctx.arc(x + 15, y + 20, 22, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Kopf
        ctx.fillStyle = '#d0c080';
        ctx.fillRect(x + 4, y, 22, 16);
        ctx.fillStyle = '#c0b070';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y + 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x + 23, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e0d0a0';
        ctx.fillRect(x + 9, y + 8, 12, 7);
        ctx.fillStyle = '#8a7a40';
        ctx.fillRect(x + 11, y + 10, 3, 3);
        ctx.fillRect(x + 17, y + 10, 3, 3);
        // Augen (weiß-gelb glühend)
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(x + 7, y + 4, 4, 4);
        ctx.fillRect(x + 19, y + 4, 4, 4);
        ctx.fillStyle = '#ffee00';
        ctx.fillRect(x + 8, y + 5, 2, 2);
        ctx.fillRect(x + 20, y + 5, 2, 2);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
