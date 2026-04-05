export class ScreenEffects {
    constructor() {
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;

        this.flashColor = null;
        this.flashDuration = 0;
        this.flashTimer = 0;
    }

    /** Bildschirm schütteln */
    shake(intensity = 5, duration = 0.2) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    /** Bildschirm blitzen */
    flash(color = '#fff', duration = 0.15) {
        this.flashColor = color;
        this.flashDuration = duration;
        this.flashTimer = duration;
    }

    update(dt) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }
    }

    applyShake(ctx) {
        if (this.shakeX !== 0 || this.shakeY !== 0) {
            ctx.translate(this.shakeX, this.shakeY);
        }
    }

    renderFlash(ctx, width, height) {
        if (this.flashTimer > 0 && this.flashColor) {
            const alpha = this.flashTimer / this.flashDuration;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        }
    }

    /** Vignette bei niedrigem HP */
    renderVignette(ctx, width, height, hpRatio) {
        if (hpRatio >= 0.3) return;
        const intensity = 1 - (hpRatio / 0.3);
        const grad = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.3,
            width / 2, height / 2, width * 0.7
        );
        grad.addColorStop(0, 'rgba(100, 0, 0, 0)');
        grad.addColorStop(1, `rgba(100, 0, 0, ${intensity * 0.5})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }
}
