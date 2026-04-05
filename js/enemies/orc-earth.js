import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcEarth extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.EARTH;
        this.health = 120;
        this.maxHealth = 120;
        this.damage = 18;
        this.speed = 30;
        this.chaseSpeed = 50;
        this.sightRange = 140;
        this.animTimer = 0;
    }

    update(dt, game) { super.update(dt, game); this.animTimer += dt * 3; }

    render(ctx) {
        if (this.aiState === STATE.DEAD) ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        if (this.invincible && this.aiState !== STATE.DEAD && Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 2 : 0;

        ctx.fillStyle = '#4a3a20';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);
        // Massiver Körper
        ctx.fillStyle = '#5a6a30';
        ctx.fillRect(x + 0, y + 12, 30, 18);
        ctx.fillStyle = '#6a7a40';
        ctx.fillRect(x + 6, y + 16, 18, 12);
        // Stein-Platten als Rüstung
        ctx.fillStyle = '#7a7a6a';
        ctx.fillRect(x + 3, y + 12, 10, 6);
        ctx.fillRect(x + 17, y + 12, 10, 6);
        // Kopf
        ctx.fillStyle = '#8a9060';
        ctx.fillRect(x + 4, y, 22, 14);
        ctx.fillStyle = '#7a8050';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 1, y - 2); ctx.lineTo(x + 7, y + 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.lineTo(x + 29, y - 2); ctx.lineTo(x + 23, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#9aa070';
        ctx.fillRect(x + 9, y + 7, 12, 6);
        ctx.fillStyle = '#4a5030';
        ctx.fillRect(x + 11, y + 9, 3, 2);
        ctx.fillRect(x + 17, y + 9, 3, 2);
        // Augen (grün)
        ctx.fillStyle = '#88aa00';
        ctx.fillRect(x + 7, y + 3, 4, 4);
        ctx.fillRect(x + 19, y + 3, 4, 4);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
