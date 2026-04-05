export class Camera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.smoothing = 0.08;

        // Level-Grenzen (werden beim Level-Laden gesetzt)
        this.minX = 0;
        this.minY = 0;
        this.maxX = 0;
        this.maxY = 0;
    }

    setLevelBounds(levelWidth, levelHeight) {
        this.minX = 0;
        this.minY = 0;
        this.maxX = Math.max(0, levelWidth - this.viewWidth);
        this.maxY = Math.max(0, levelHeight - this.viewHeight);
    }

    follow(target) {
        // Zielposition: Spieler zentriert, leicht nach oben versetzt
        const targetX = target.x + target.width / 2 - this.viewWidth / 2;
        const targetY = target.y + target.height / 2 - this.viewHeight / 2 - 30;

        // Lerp-Smoothing
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;

        // An Level-Grenzen klemmen
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    reset(ctx) {
        ctx.restore();
    }
}
