import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcWater extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.WATER;
        this.health = 90;
        this.maxHealth = 90;
        this.damage = 10;
        this.speed = 40;
        this.chaseSpeed = 70;
        this.sightRange = 160;
        this.animTimer = 0;
    }

    update(dt, game) { super.update(dt, game); this.animTimer += dt * 4; }

    render(ctx) {
        if (this.aiState === STATE.DEAD) ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        if (this.invincible && this.aiState !== STATE.DEAD && Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 3 : 0;

        ctx.fillStyle = '#1a4a6a';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);
        ctx.fillStyle = '#2266aa';
        ctx.fillRect(x + 2, y + 14, 26, 16);
        ctx.fillStyle = '#3388cc';
        ctx.fillRect(x + 8, y + 18, 14, 10);
        // Tropfen-Effekt
        const drip = (this.animTimer * 20) % 16;
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(x + 6, y + 14 + drip, 2, 3);
        ctx.fillRect(x + 22, y + 14 + drip * 0.7, 2, 3);
        // Kopf
        ctx.fillStyle = '#7090a0';
        ctx.fillRect(x + 4, y, 22, 16);
        ctx.fillStyle = '#608090';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y + 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x + 23, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#90aab0';
        ctx.fillRect(x + 9, y + 8, 12, 7);
        ctx.fillStyle = '#405060';
        ctx.fillRect(x + 11, y + 10, 3, 3);
        ctx.fillRect(x + 17, y + 10, 3, 3);
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(x + 7, y + 4, 4, 4);
        ctx.fillRect(x + 19, y + 4, 4, 4);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
