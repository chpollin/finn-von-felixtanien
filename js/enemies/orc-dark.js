import { Enemy, STATE } from './enemy.js';
import { Entity } from '../entity.js';
import { ELEMENTS } from '../elements.js';

/** Schattenkugel — fliegt auf den Spieler zu, macht Schaden */
class ShadowBolt extends Entity {
    constructor(x, y, dirX) {
        super(x, y);
        this.width = 10;
        this.height = 10;
        this.vx = dirX * 180;
        this.vy = 0;
        this.damage = 10;
        this.lifetime = 2;
        this.timer = 0;
        this.alive = true;
    }

    update(dt, game) {
        this.timer += dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0) { this.destroy(); return; }

        // Leicht wellenförmig
        this.vy = Math.sin(this.timer * 6) * 30;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wand-Kollision
        if (game.tilemap && game.tilemap.isSolidAtWorld(this.x + 5, this.y + 5)) {
            if (game.particles) {
                game.particles.emit(this.x + 5, this.y + 5, 6, {
                    color: '#8844cc', speed: 60, life: 0.3, size: 2
                });
            }
            this.destroy();
            return;
        }

        // Spieler treffen
        if (game.player && !game.player.invincible && this.collidesWith(game.player)) {
            game.player.takeDamage(this.damage, null, game);
            if (game.player.vx !== undefined) {
                game.player.vx = this.vx > 0 ? 150 : -150;
                game.player.vy = -80;
                game.player.grounded = false;
            }
            if (game.particles) {
                game.particles.emitHit(game.player.x + game.player.width / 2, game.player.y + 10, '#8844cc');
            }
            if (game.screenFx) game.screenFx.shake(3, 0.1);
            this.destroy();
        }
    }

    render(ctx) {
        const cx = this.x + 5;
        const cy = this.y + 5;
        const pulse = Math.sin(this.timer * 15) * 2;

        // Äußerer Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#6600aa';
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Kern
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#aa55ee';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Heller Kern
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#cc88ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Schweif-Partikel
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#8844cc';
        for (let i = 1; i <= 3; i++) {
            ctx.fillRect(cx - this.vx * 0.003 * i - 1, cy + Math.sin(this.timer * 8 + i) * 3, 3, 3);
        }
        ctx.globalAlpha = 1;
    }
}

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

        // Schattenkugel-Fernattacke
        this.shootCooldown = 0;
        this.shootCooldownMax = 2.5;
        this.shooting = false;
        this.shootAnim = 0;
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

        // Schuss-Animation
        if (this.shooting) {
            this.shootAnim -= dt;
            if (this.shootAnim <= 0) this.shooting = false;
        }

        // Schattenkugel schießen wenn Spieler in Sicht
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.aiState === STATE.CHASE && game.player && this.shootCooldown <= 0 && !this.faded) {
            const dx = game.player.x - this.x;
            const dist = Math.abs(dx);
            if (dist > 60 && dist < this.sightRange) {
                const dir = dx > 0 ? 1 : -1;
                const bx = this.x + this.width / 2 + dir * 14;
                const by = this.y + 12;
                const bolt = new ShadowBolt(bx, by, dir);
                bolt.damage = Math.round(bolt.damage * (this._damageMult || 1));
                game.addEntity(bolt);
                this.shootCooldown = this.shootCooldownMax;
                this.shooting = true;
                this.shootAnim = 0.3;

                if (game.particles) {
                    game.particles.emit(bx, by, 5, {
                        color: '#8844cc', speed: 60, life: 0.3, size: 3
                    });
                }
            }
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

        // Schatten-Aura (pulsierend)
        const auraPulse = Math.sin(this.animTimer * 2) * 0.1;
        ctx.fillStyle = '#6600aa';
        ctx.globalAlpha = (this.faded ? 0.05 : 0.15) + auraPulse;
        ctx.beginPath();
        ctx.arc(x + 15, y + 20, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = this.faded ? 0.15 : 1;

        // --- Beine (dunkel-lila) ---
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);

        // --- Körper (dunkel-lila Robe) ---
        ctx.fillStyle = '#3a2a4a';
        ctx.fillRect(x + 1, y + 12, 28, 18);
        // Robe-Saum (ausgefranst)
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(x, y + 26, 30, 5);
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(x + i * 5, y + 29, 3, 3 + (i % 2) * 2);
        }

        // --- Kapuze ---
        // Kapuzen-Form (großes spitzes Dreieck über Kopf)
        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath();
        ctx.moveTo(x - 1, y + 16);       // Linke Schulter
        ctx.lineTo(x + 15, y - 10);      // Spitze der Kapuze
        ctx.lineTo(x + 31, y + 16);      // Rechte Schulter
        ctx.closePath();
        ctx.fill();

        // Kapuzen-Inneres (dunkler, Schatten)
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 14);
        ctx.lineTo(x + 15, y - 2);
        ctx.lineTo(x + 25, y + 14);
        ctx.closePath();
        ctx.fill();

        // Leuchtende Augen in der Kapuze
        const eyeGlow = 0.7 + Math.sin(this.animTimer * 3) * 0.3;
        ctx.fillStyle = '#cc66ff';
        ctx.globalAlpha = (this.faded ? 0.15 : 1) * eyeGlow;
        ctx.fillRect(x + 8, y + 6, 4, 3);
        ctx.fillRect(x + 18, y + 6, 4, 3);
        // Augen-Glühen
        ctx.fillStyle = '#aa44ee';
        ctx.globalAlpha = (this.faded ? 0.05 : 0.3) * eyeGlow;
        ctx.beginPath();
        ctx.arc(x + 10, y + 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 20, y + 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = this.faded ? 0.15 : 1;

        // --- Hände (Schattenkugel-Pose wenn schießend) ---
        if (this.shooting) {
            // Hände nach vorne gestreckt
            ctx.fillStyle = '#5a4060';
            ctx.fillRect(x + 24, y + 14, 8, 5);
            // Schattenkugel in der Hand
            ctx.fillStyle = '#aa55ee';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x + 34, y + 16, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = this.faded ? 0.15 : 1;
        } else {
            // Hände normal
            ctx.fillStyle = '#5a4060';
            ctx.fillRect(x + 24, y + 18, 5, 6);
        }

        ctx.restore();
        this.renderHealthBar(ctx);
        ctx.globalAlpha = 1;
    }
}
