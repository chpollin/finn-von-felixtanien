import { Enemy, STATE } from './enemy.js';

export class OrcBasic extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 30;
        this.height = 42;

        this.health = 60;
        this.maxHealth = 60;
        this.damage = 12;
        this.speed = 55;
        this.chaseSpeed = 95;
        this.sightRange = 170;

        this.animTimer = 0;
    }

    update(dt, game) {
        super.update(dt, game);
        this.animTimer += dt * 5;
    }

    onDeath() {
        // Score-Vergabe passiert im Spawner/Game
    }

    render(ctx) {
        if (this.aiState === STATE.DEAD) {
            // Tod-Animation: blinkt und fällt um
            const alpha = 1 - (this.deathTimer / this.deathDuration);
            ctx.globalAlpha = alpha;
        }

        // Blink bei i-Frames
        if (this.invincible && this.aiState !== STATE.DEAD) {
            if (Math.floor(this.invincibleTimer * 12) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }
        }

        ctx.save();

        const cx = this.x + this.width / 2;
        if (!this.facingRight) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        const x = Math.round(this.x);
        const y = Math.round(this.y);

        const legAnim = this.vx !== 0
            ? Math.sin(this.animTimer * Math.PI) * 3
            : 0;

        // --- Beine (dunkelgrün) ---
        ctx.fillStyle = '#4a6b3a';
        ctx.fillRect(x + 4, y + 28, 8, 12 + legAnim);
        ctx.fillRect(x + 18, y + 28, 8, 12 - legAnim);

        // Füße (braun)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x + 3, y + 38 + Math.max(legAnim, 0), 10, 4);
        ctx.fillRect(x + 17, y + 38 + Math.max(-legAnim, 0), 10, 4);

        // --- Körper (schmutzig grün) ---
        ctx.fillStyle = '#5a7a4a';
        ctx.fillRect(x + 2, y + 14, 26, 16);

        // Bauch (heller)
        ctx.fillStyle = '#6a8a5a';
        ctx.fillRect(x + 8, y + 18, 14, 10);

        // Rüstungs-Fetzen (braun)
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(x + 2, y + 14, 26, 3);

        // --- Kopf (rosa Schweinekopf) ---
        // Kopfform
        ctx.fillStyle = '#d4967a';
        ctx.fillRect(x + 4, y, 22, 16);

        // Ohren (spitz, links und rechts)
        ctx.fillStyle = '#c48060';
        // Linkes Ohr
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x, y - 4);
        ctx.lineTo(x + 7, y + 2);
        ctx.closePath();
        ctx.fill();
        // Rechtes Ohr
        ctx.beginPath();
        ctx.moveTo(x + 26, y + 4);
        ctx.lineTo(x + 30, y - 4);
        ctx.lineTo(x + 23, y + 2);
        ctx.closePath();
        ctx.fill();

        // Schnauze (heller rosa, prominent)
        ctx.fillStyle = '#e0a88e';
        ctx.fillRect(x + 9, y + 8, 12, 7);

        // Nasenlöcher
        ctx.fillStyle = '#8a5040';
        ctx.fillRect(x + 11, y + 10, 3, 3);
        ctx.fillRect(x + 17, y + 10, 3, 3);

        // Augen (rot, böse)
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(x + 7, y + 4, 4, 4);
        ctx.fillRect(x + 19, y + 4, 4, 4);

        // Augen-Pupillen (dunkel)
        ctx.fillStyle = '#440000';
        ctx.fillRect(x + 8, y + 5, 2, 2);
        ctx.fillRect(x + 20, y + 5, 2, 2);

        // Böse Augenbrauen
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(x + 6, y + 2, 6, 2);
        ctx.fillRect(x + 18, y + 2, 6, 2);

        // Mund (zähnefletschend)
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(x + 10, y + 13, 10, 2);
        // Hauer/Zähne
        ctx.fillStyle = '#ffe';
        ctx.fillRect(x + 11, y + 12, 2, 3);
        ctx.fillRect(x + 18, y + 12, 2, 3);

        // --- Keule (Waffe, rechte Hand) ---
        // Arm
        ctx.fillStyle = '#5a7a4a';
        ctx.fillRect(x + 24, y + 16, 5, 8);
        // Hand
        ctx.fillStyle = '#d4967a';
        ctx.fillRect(x + 24, y + 23, 5, 4);
        // Keulenstiel
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(x + 25, y + 20, 3, 14);
        // Keulenkopf
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x + 23, y + 32, 7, 8);
        // Nägel in der Keule
        ctx.fillStyle = '#aaa';
        ctx.fillRect(x + 24, y + 33, 2, 2);
        ctx.fillRect(x + 28, y + 36, 2, 2);

        ctx.restore();

        // HP-Balken
        this.renderHealthBar(ctx);

        ctx.globalAlpha = 1;
    }
}
