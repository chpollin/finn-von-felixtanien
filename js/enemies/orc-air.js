import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcAir extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.AIR;
        this.health = 40;
        this.maxHealth = 40;
        this.damage = 10;
        this.speed = 90;
        this.chaseSpeed = 160;
        this.sightRange = 220;
        this.animTimer = 0;
    }

    update(dt, game) { super.update(dt, game); this.animTimer += dt * 7; }

    render(ctx) {
        if (this.aiState === STATE.DEAD) ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        if (this.invincible && this.aiState !== STATE.DEAD && Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 4 : 0;
        const float = Math.sin(this.animTimer * 0.5) * 2;

        ctx.fillStyle = '#6a8a9a';
        ctx.fillRect(x + 5, y + 28 + float, 7, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28 + float, 7, 12 - legAnim);
        // Schlanker Körper
        ctx.fillStyle = '#8abacc';
        ctx.fillRect(x + 4, y + 14 + float, 22, 16);
        ctx.fillStyle = '#aaddee';
        ctx.fillRect(x + 9, y + 18 + float, 12, 8);
        // Windlinien
        ctx.strokeStyle = '#ccffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
            const wx = x - 4 + (this.animTimer * 30 + i * 20) % 40;
            ctx.beginPath(); ctx.moveTo(wx, y + 16 + i * 8); ctx.lineTo(wx + 12, y + 14 + i * 8); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Kopf
        ctx.fillStyle = '#a0b8c0';
        ctx.fillRect(x + 6, y + float, 18, 15);
        ctx.fillStyle = '#90a8b0';
        ctx.beginPath(); ctx.moveTo(x + 6, y + 4 + float); ctx.lineTo(x + 2, y - 5 + float); ctx.lineTo(x + 9, y + 2 + float); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 24, y + 4 + float); ctx.lineTo(x + 28, y - 5 + float); ctx.lineTo(x + 21, y + 2 + float); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b8d0d8';
        ctx.fillRect(x + 10, y + 8 + float, 10, 6);
        ctx.fillStyle = '#607078';
        ctx.fillRect(x + 12, y + 10 + float, 2, 2);
        ctx.fillRect(x + 17, y + 10 + float, 2, 2);
        ctx.fillStyle = '#aaeeff';
        ctx.fillRect(x + 9, y + 3 + float, 3, 4);
        ctx.fillRect(x + 18, y + 3 + float, 3, 4);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
