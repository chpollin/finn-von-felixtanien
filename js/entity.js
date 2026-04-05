/**
 * Basis-Klasse für alle Spielobjekte.
 */
export class Entity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;

        // Kampf-Defaults
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.4;
        this.grounded = false;
    }

    update(dt, game) {
        // Override in Unterklasse
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
    }

    render(ctx) {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /** Schaden nehmen — gibt tatsächlichen Schaden zurück */
    takeDamage(amount, element = null) {
        if (this.invincible) return 0;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        this.onHit(amount, element);
        return amount;
    }

    onHit(amount, element) {
        // Override für Reaktion auf Treffer
    }

    onDeath() {
        // Override für Tod-Effekte
    }

    /** AABB-Kollisionserkennung */
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
