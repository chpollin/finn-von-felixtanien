import { Enemy, STATE } from './enemy.js';
import { ELEMENTS } from '../elements.js';

export class OrcFire extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.element = ELEMENTS.FIRE;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 14;
        this.speed = 75;
        this.chaseSpeed = 130;
        this.sightRange = 200;
        this.animTimer = 0;
    }

    update(dt, game) {
        super.update(dt, game);
        this.animTimer += dt * 6;
    }

    render(ctx) {
        if (this.aiState === STATE.DEAD) {
            ctx.globalAlpha = 1 - (this.deathTimer / this.deathDuration);
        }
        if (this.invincible && this.aiState !== STATE.DEAD) {
            if (Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        }

        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }

        const x = Math.round(this.x), y = Math.round(this.y);
        const legAnim = this.vx !== 0 ? Math.sin(this.animTimer * Math.PI) * 3 : 0;

        // Beine (dunkelorange)
        ctx.fillStyle = '#8a3a10';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);

        // Körper (orange-rot)
        ctx.fillStyle = '#cc4400';
        ctx.fillRect(x + 2, y + 14, 26, 16);
        ctx.fillStyle = '#dd5500';
        ctx.fillRect(x + 8, y + 18, 14, 10);

        // Flammen-Effekt auf Schultern
        const flicker = Math.sin(this.animTimer * 4) * 2;
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(x + 1, y + 10 + flicker, 6, 6);
        ctx.fillRect(x + 23, y + 10 - flicker, 6, 6);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(x + 2, y + 8 + flicker, 4, 4);
        ctx.fillRect(x + 24, y + 8 - flicker, 4, 4);

        // Kopf (dunkel-rosa/rot)
        ctx.fillStyle = '#c46050';
        ctx.fillRect(x + 4, y, 22, 16);
        // Ohren
        ctx.fillStyle = '#aa4030';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y + 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x + 23, y + 2); ctx.closePath(); ctx.fill();
        // Schnauze
        ctx.fillStyle = '#d07060';
        ctx.fillRect(x + 9, y + 8, 12, 7);
        ctx.fillStyle = '#6a2010';
        ctx.fillRect(x + 11, y + 10, 3, 3);
        ctx.fillRect(x + 17, y + 10, 3, 3);
        // Augen (gelb-glühend)
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(x + 7, y + 4, 4, 4);
        ctx.fillRect(x + 19, y + 4, 4, 4);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(x + 8, y + 5, 2, 2);
        ctx.fillRect(x + 20, y + 5, 2, 2);

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
