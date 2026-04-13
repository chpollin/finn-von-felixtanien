import { Entity } from '../entity.js';
import { applyGravity } from '../physics.js';

// KI-Zustände
const STATE = {
    IDLE: 'idle',
    PATROL: 'patrol',
    CHASE: 'chase',
    ATTACK: 'attack',
    HURT: 'hurt',
    DEAD: 'dead',
};

export { STATE };

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 30;
        this.height = 40;

        // Stats
        this.health = 60;
        this.maxHealth = 60;
        this.damage = 15;
        this.speed = 60;
        this.chaseSpeed = 100;
        this.element = null;

        // KI
        this.aiState = STATE.PATROL;
        this.facingRight = false;
        this.sightRange = 180;
        this.attackRange = 35;
        this.attackCooldown = 0;
        this.attackCooldownMax = 1.2;

        // Patrol
        this.patrolOrigin = x;
        this.patrolRange = 80;
        this.patrolDir = 1;

        // Hurt-Timer
        this.hurtTimer = 0;
        this.hurtDuration = 0.25;

        // Tod
        this.deathTimer = 0;
        this.deathDuration = 0.4;

        // Physik
        this.grounded = false;
    }

    update(dt, game) {
        super.update(dt, game); // i-Frames

        if (this.aiState === STATE.DEAD) {
            this.deathTimer += dt;
            if (this.deathTimer >= this.deathDuration) {
                this.destroy();
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Hurt-Zustand
        if (this.aiState === STATE.HURT) {
            this.hurtTimer -= dt;
            if (this.hurtTimer <= 0) {
                this.aiState = STATE.CHASE;
            }
            // Schwerkraft + Bewegung weiterlaufen lassen
            applyGravity(this, dt);
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= 0.9;
            if (game.tilemap) game.tilemap.resolveCollision(this);
            return;
        }

        const player = game.player;
        if (!player || player.health <= 0) {
            this.aiState = STATE.IDLE;
        }

        // Distanz zum Spieler
        const dx = player ? (player.x + player.width / 2) - (this.x + this.width / 2) : 999;
        const dy = player ? (player.y + player.height / 2) - (this.y + this.height / 2) : 999;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // KI State-Machine
        switch (this.aiState) {
            case STATE.IDLE:
                this.vx = 0;
                break;

            case STATE.PATROL:
                this.vx = this.patrolDir * this.speed;
                this.facingRight = this.patrolDir > 0;

                // Umdrehen bei Patrol-Grenze
                if (this.x > this.patrolOrigin + this.patrolRange) this.patrolDir = -1;
                if (this.x < this.patrolOrigin - this.patrolRange) this.patrolDir = 1;

                // Kantenerkennung: drehe um wenn kein Boden vor dir
                if (this.grounded && game.tilemap) {
                    const checkX = this.facingRight ? this.x + this.width + 4 : this.x - 4;
                    const checkY = this.y + this.height + 4;
                    if (!game.tilemap.isSolidAtWorld(checkX, checkY)) {
                        this.patrolDir *= -1;
                        this.facingRight = this.patrolDir > 0;
                    }
                }

                // Spieler in Sicht → Chase
                if (dist < this.sightRange) {
                    this.aiState = STATE.CHASE;
                }
                break;

            case STATE.CHASE:
                this.facingRight = dx > 0;
                this.vx = (dx > 0 ? 1 : -1) * this.chaseSpeed;

                // Kantenerkennung
                if (this.grounded && game.tilemap) {
                    const checkX = this.facingRight ? this.x + this.width + 4 : this.x - 4;
                    const checkY = this.y + this.height + 4;
                    if (!game.tilemap.isSolidAtWorld(checkX, checkY)) {
                        this.vx = 0;
                    }
                }

                // In Angriffsreichweite → Attack
                if (dist < this.attackRange && this.attackCooldown <= 0) {
                    this.aiState = STATE.ATTACK;
                }

                // Spieler zu weit weg → Patrol
                if (dist > this.sightRange * 1.5) {
                    this.aiState = STATE.PATROL;
                }
                break;

            case STATE.ATTACK:
                this.vx = 0;
                if (player && this.attackCooldown <= 0) {
                    // Kontaktschaden
                    if (this.collidesWith(player)) {
                        player.takeDamage(this.damage, null, game);
                        if (player.vx !== undefined) {
                            const kdir = player.x > this.x ? 1 : -1;
                            player.vx = kdir * 200;
                            player.vy = -120;
                            player.grounded = false;
                        }
                    }
                    this.attackCooldown = this.attackCooldownMax;
                }
                this.aiState = STATE.CHASE;
                break;
        }

        // Schwerkraft
        applyGravity(this, dt);

        // Position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Tile-Kollision
        this.grounded = false;
        if (game.tilemap) {
            game.tilemap.resolveCollision(this);
        }
    }

    takeDamage(amount, element = null) {
        if (this.invincible || this.aiState === STATE.DEAD) return 0;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;

        if (this.health <= 0) {
            this.health = 0;
            this.aiState = STATE.DEAD;
            this.onDeath();
        } else {
            this.aiState = STATE.HURT;
            this.hurtTimer = this.hurtDuration;
        }
        return amount;
    }

    onDeath() {
        // Score wird in Unterklasse vergeben
    }

    /** HP-Balken über dem Feind */
    renderHealthBar(ctx) {
        if (this.health >= this.maxHealth) return;
        const barW = this.width;
        const barH = 4;
        const bx = this.x;
        const by = this.y - 8;

        ctx.fillStyle = '#400';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = '#d33';
        ctx.fillRect(bx, by, barW * (this.health / this.maxHealth), barH);
    }
}
