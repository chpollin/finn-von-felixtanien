/**
 * Basis-Klasse für alle Spielobjekte.
 * Einfach erweitern und update()/render() überschreiben.
 */
export class Entity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.alive = true;
    }

    update(dt, game) {
        // Override in Unterklasse
    }

    render(ctx) {
        // Override in Unterklasse — Standard: farbiges Rechteck
        ctx.fillStyle = '#e94560';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /** Einfache AABB-Kollisionserkennung */
    collidesWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    destroy() {
        this.alive = false;
    }
}
