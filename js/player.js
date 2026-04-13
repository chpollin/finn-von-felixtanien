import { Entity } from './entity.js';
import { applyGravity, clamp, FRICTION } from './physics.js';
import { createAttackHitbox, hitboxOverlaps, applyKnockback } from './combat.js';
import { getEffectiveness, getElementColor, getElementGlow } from './elements.js';
import { createRangedAttack } from './projectile.js';
import { TILE } from './tilemap.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 28;
        this.height = 48;

        // Bewegung
        this.vx = 0;
        this.vy = 0;
        this.speed = 220;
        this.jumpForce = -460;
        this.grounded = false;
        this.facingRight = true;

        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.attackPower = 25;

        // Elemente
        this.elements = new Set();
        this.activeElement = null;

        // Kampf
        this.attacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0.3;
        this.attackCooldown = 0;
        this.attackCooldownMax = 0.15;
        this.attackHasHit = false;

        // Fernattacke
        this.rangedCooldown = 0;
        this.rangedCooldownMax = 1.2;

        // i-Frames
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.8;

        // Coyote Time + Jump Buffer
        this.coyoteTimer = 0;
        this.coyoteTime = 0.1;
        this.jumpBufferTimer = 0;
        this.jumpBufferTime = 0.1;
        this.wasGrounded = false;

        // Spike-Schaden
        this._spikeTimer = 0;

        // Animation
        this.animTimer = 0;
        this.animFrame = 0;
        this.state = 'idle'; // idle, run, jump, fall, attack
    }

    addElement(element) {
        this.elements.add(element);
        if (!this.activeElement) this.activeElement = element;
    }

    update(dt, game) {
        const input = game.input;

        // --- Element-Wechsel (Tasten 1-6) ---
        const elemOrder = ['fire', 'water', 'earth', 'air', 'dark', 'light'];
        for (let i = 0; i < 6; i++) {
            if (input.justPressed('Digit' + (i + 1)) && this.elements.has(elemOrder[i])) {
                this.activeElement = elemOrder[i];
            }
        }
        // Q/E zum Durchschalten
        if (input.justPressed('KeyQ') || input.justPressed('KeyE')) {
            const collected = elemOrder.filter(e => this.elements.has(e));
            if (collected.length > 0) {
                const dir = input.justPressed('KeyE') ? 1 : -1;
                const idx = collected.indexOf(this.activeElement);
                const next = (idx + dir + collected.length) % collected.length;
                this.activeElement = collected[next];
            }
        }

        // --- Cooldowns ---
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // --- Fernattacke (K-Taste) ---
        if (this.rangedCooldown > 0) this.rangedCooldown -= dt;
        if (input.justPressed('KeyK') && this.activeElement && this.rangedCooldown <= 0) {
            this.rangedCooldown = this.rangedCooldownMax;
            const proj = createRangedAttack(this, this.activeElement, game);
            game.addEntity(proj);
            if (game.audio) game.audio.play('slash');
            if (game.particles) {
                game.particles.emit(
                    this.x + this.width / 2, this.y + this.height / 2,
                    6, { color: getElementColor(this.activeElement), speed: 60, life: 0.2, size: 3 }
                );
            }
        }

        // --- Angriff ---
        if (this.attacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attacking = false;
                this.attackCooldown = this.attackCooldownMax;
            } else {
                // Schwert-Hitbox prüfen
                this.checkAttackHits(game);
            }
        }

        // Angriff starten
        const attackPressed = input.isKeyDown('KeyJ') || input.isKeyDown('KeyX') || game.input.mouse.down;
        if (attackPressed && !this.attacking && this.attackCooldown <= 0) {
            this.attacking = true;
            this.attackTimer = this.attackDuration;
            this.attackHasHit = false;
            this.state = 'attack';

            // Slash-Partikel + Sound
            if (game.particles) {
                const sx = this.facingRight ? this.x + this.width + 16 : this.x - 16;
                const sy = this.y + this.height / 2;
                const elemColor = this.activeElement ? getElementColor(this.activeElement) : '#ff6644';
                game.particles.emitSlash(sx, sy, this.facingRight, elemColor);
            }
            if (game.audio) game.audio.play('slash');
        }

        // --- Auf Reittier? → Bewegung wird vom Mount gesteuert ---
        if (this._onMount) {
            // Animation Timer trotzdem laufen lassen
            this.state = 'idle';
            return;
        }

        // --- Horizontale Bewegung (leicht gedämpft während Angriff) ---
        let moveX = 0;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) moveX = -1;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) moveX = 1;

        const moveSpeed = this.attacking ? this.speed * 0.4 : this.speed;

        if (moveX !== 0) {
            this.vx = moveX * moveSpeed;
            if (!this.attacking) this.facingRight = moveX > 0;
            if (!this.attacking && this.grounded) this.state = 'run';
        } else {
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < 5) this.vx = 0;
            if (this.grounded && !this.attacking) this.state = 'idle';
        }

        // --- Sprung (mit Coyote Time + Jump Buffer) ---
        const jumpHeld = input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW') || input.isKeyDown('Space');
        const jumpJust = input.justPressed('ArrowUp') || input.justPressed('KeyW') || input.justPressed('Space');
        // Jump Buffer: justPressed in der Luft → merken
        if (jumpJust) this.jumpBufferTimer = this.jumpBufferTime;
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

        // Sprung ausführen: entweder gehalten+grounded (Original) oder Buffer+Coyote
        const canCoyote = this.coyoteTimer > 0;
        if ((jumpHeld && this.grounded) || (this.jumpBufferTimer > 0 && canCoyote)) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            if (!this.attacking) this.state = 'jump';
            if (game.audio) game.audio.play('jump');
        }

        // --- Schwerkraft ---
        applyGravity(this, dt);

        // --- Luft-Zustand ---
        if (!this.grounded && !this.attacking) {
            this.state = this.vy < 0 ? 'jump' : 'fall';
        }

        // --- Position aktualisieren ---
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // --- Tile-Kollision ---
        const wasGroundedBefore = this.grounded;
        this.grounded = false;
        if (game.tilemap) {
            game.tilemap.resolveCollision(this);
        }

        // Coyote Time: Wenn gerade den Boden verlassen, kurzes Sprungfenster
        if (wasGroundedBefore && !this.grounded) {
            this.coyoteTimer = this.coyoteTime;
        }
        if (this.coyoteTimer > 0 && !this.grounded) this.coyoteTimer -= dt;
        if (this.grounded) this.coyoteTimer = 0;

        // --- Spike-Schaden ---
        if (this._spikeTimer > 0) this._spikeTimer -= dt;
        if (game.tilemap && this.grounded && this._spikeTimer <= 0) {
            const footTile = game.tilemap.getTileAtWorld(this.x + this.width / 2, this.y + this.height + 1);
            if (footTile === TILE.SPIKE) {
                this.takeDamage(15, null, game);
                this._spikeTimer = 0.5;
            }
        }

        // --- Level-Grenzen ---
        if (game.tilemap) {
            this.x = clamp(this.x, 0, game.tilemap.widthPx - this.width);
            if (this.y > game.tilemap.heightPx + 64) {
                const fallDmg = Math.round(20 * (this._fallDamageMult || 1));
                this.health -= fallDmg;
                if (this._fallSafe && this.health <= 0) this.health = 1;
                this.x = game.levelStart.x;
                this.y = game.levelStart.y;
                this.vx = 0;
                this.vy = 0;
            }
        }

        // --- Animation Timer ---
        if (this.state === 'run') {
            this.animTimer += dt * 8;
            this.animFrame = Math.floor(this.animTimer) % 4;
        } else if (this.state !== 'attack') {
            this.animTimer = 0;
            this.animFrame = 0;
        }
    }

    checkAttackHits(game) {
        if (this.attackHasHit) return;

        const hitbox = createAttackHitbox(this, this.facingRight, 38, 36);

        for (const entity of game.entities) {
            if (entity === this) continue;
            if (!entity.takeDamage) continue;
            if (entity.invincible) continue;

            if (hitboxOverlaps(hitbox, entity)) {
                // Element-Multiplikator berechnen
                const mult = getEffectiveness(this.activeElement, entity.element);
                const baseDmg = Math.round(this.attackPower * mult);
                const dmg = entity.takeDamage(baseDmg, this.activeElement);
                applyKnockback(entity, this.x + this.width / 2, mult >= 2 ? 350 : 250);
                this.attackHasHit = true;

                // Treffer-Effekte
                if (game.audio) game.audio.play('hit');
                if (game.screenFx) game.screenFx.shake(mult >= 2 ? 6 : 3, 0.15);
                if (game.particles) {
                    const hx = (hitbox.x + hitbox.width / 2);
                    const hy = (hitbox.y + hitbox.height / 2);
                    const elemColor = this.activeElement ? getElementColor(this.activeElement) : '#ff4';
                    game.particles.emitHit(hx, hy, elemColor);

                    if (mult >= 2) {
                        // Super effektiv!
                        game.particles.showDamage(entity.x + entity.width / 2, entity.y - 24, 'SUPER!', '#ff0');
                        game.particles.showDamage(entity.x + entity.width / 2, entity.y - 8, dmg, '#ff0');
                        game.particles.emit(hx, hy, 20, { color: elemColor, speed: 200, life: 0.5, size: 5 });
                    } else if (mult <= 0.5) {
                        game.particles.showDamage(entity.x + entity.width / 2, entity.y - 8, dmg, '#888');
                    } else {
                        game.particles.showDamage(entity.x + entity.width / 2, entity.y - 8, dmg, '#ff4');
                    }
                }
                break;
            }
        }
    }

    takeDamage(amount, element = null, game = null) {
        if (this.invincible) return 0;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        if (this.health <= 0) this.health = 0;
        if (game && game.audio) game.audio.play('hurt');
        return amount;
    }

    render(ctx) {
        // Blink-Effekt bei i-Frames
        if (this.invincible && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            return;
        }

        ctx.save();

        // Spiegeln wenn nach links schauend
        const cx = this.x + this.width / 2;
        if (!this.facingRight) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        const x = Math.round(this.x);
        const y = Math.round(this.y);

        // --- Schwert-Schwung-Winkel ---
        const swingProgress = this.attacking
            ? 1 - (this.attackTimer / this.attackDuration)
            : 0;

        // --- Bein-Animation ---
        const legOffset = this.state === 'run'
            ? Math.sin(this.animTimer * Math.PI) * 4
            : 0;

        // Beine (beige Hose)
        ctx.fillStyle = '#c8a96e';
        ctx.fillRect(x + 5, y + 32, 7, 14 + legOffset);
        ctx.fillRect(x + 16, y + 32, 7, 14 - legOffset);

        // Schuhe (dunkelbraun)
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(x + 4, y + 44 + Math.max(legOffset, 0), 9, 4);
        ctx.fillRect(x + 15, y + 44 + Math.max(-legOffset, 0), 9, 4);

        // --- Arm hinten (linker Arm, ohne Schwert) ---
        ctx.fillStyle = '#2e6bbf';
        ctx.fillRect(x + 1, y + 16, 5, 12);
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 1, y + 27, 5, 4);

        // Körper / Hemd (blau)
        ctx.fillStyle = '#2e6bbf';
        ctx.fillRect(x + 4, y + 14, 20, 19);

        // Kragen (dunkleres blau)
        ctx.fillStyle = '#1e4a8a';
        ctx.fillRect(x + 8, y + 14, 12, 3);

        // Gürtel (braun)
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(x + 4, y + 31, 20, 3);

        // Gürtelschnalle (gold)
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(x + 12, y + 31, 4, 3);

        // --- Kopf ---
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(x + 6, y, 16, 8);

        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 7, y + 4, 14, 11);

        ctx.fillStyle = '#5c3317';
        ctx.fillRect(x + 6, y + 1, 16, 5);

        // Augen
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 10, y + 8, 3, 3);
        ctx.fillRect(x + 16, y + 8, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 11, y + 8, 1, 1);
        ctx.fillRect(x + 17, y + 8, 1, 1);

        // Mund
        ctx.fillStyle = '#8b5e3c';
        ctx.fillRect(x + 11, y + 12, 6, 1);

        // --- Schwertarm + Katana ---
        if (this.attacking) {
            this.renderSwordSwing(ctx, x, y, swingProgress);
        } else {
            this.renderSwordIdle(ctx, x, y);
        }

        ctx.restore();
    }

    get swordColor() {
        return this.activeElement ? getElementColor(this.activeElement) : '#cc1100';
    }

    get swordGlow() {
        return this.activeElement ? getElementGlow(this.activeElement) : '#ff4433';
    }

    /** Schwert in Ruheposition (in der Hand, nach oben) */
    renderSwordIdle(ctx, x, y) {
        // Arm
        ctx.fillStyle = '#2e6bbf';
        ctx.fillRect(x + 22, y + 16, 5, 10);
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(x + 22, y + 24, 5, 5);

        // Griff
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(x + 23, y + 22, 3, 12);
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(x + 23, y + 24, 3, 2);
        ctx.fillRect(x + 23, y + 28, 3, 2);

        // Tsuba
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(x + 21, y + 21, 7, 2);

        // Klinge (Element-Farbe)
        ctx.fillStyle = this.swordColor;
        ctx.fillRect(x + 23, y - 2, 3, 23);
        ctx.fillStyle = this.swordGlow;
        ctx.fillRect(x + 23, y - 2, 1, 23);

        // Element-Glow um Klinge
        if (this.activeElement) {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = this.swordGlow;
            ctx.fillRect(x + 20, y - 4, 9, 27);
            ctx.globalAlpha = 1;
        }

        // Spitze
        ctx.fillStyle = this.swordColor;
        ctx.beginPath();
        ctx.moveTo(x + 23, y - 2);
        ctx.lineTo(x + 26, y - 2);
        ctx.lineTo(x + 24.5, y - 6);
        ctx.closePath();
        ctx.fill();
    }

    /** Schwert-Schwung-Animation */
    renderSwordSwing(ctx, x, y, progress) {
        // Arm folgt dem Schwert
        const pivotX = x + 24;
        const pivotY = y + 20;

        // Schwung: von oben (-90°) nach vorne-unten (+60°)
        const startAngle = -Math.PI * 0.6;
        const endAngle = Math.PI * 0.35;
        // Ease-Out für schnellen Start, langsames Ende
        const eased = 1 - Math.pow(1 - progress, 3);
        const angle = startAngle + (endAngle - startAngle) * eased;

        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle);

        // Arm
        ctx.fillStyle = '#2e6bbf';
        ctx.fillRect(-2, -2, 5, 10);
        ctx.fillStyle = '#e8b88a';
        ctx.fillRect(-2, 7, 5, 4);

        // Griff
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(-1, 8, 3, 8);
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(-1, 9, 3, 2);
        ctx.fillRect(-1, 13, 3, 2);

        // Tsuba
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(-3, 5, 7, 2);

        // Klinge (Element-Farbe)
        ctx.fillStyle = this.swordColor;
        ctx.fillRect(-1, -26, 3, 31);
        ctx.fillStyle = this.swordGlow;
        ctx.fillRect(-1, -26, 1, 31);

        // Element-Glow
        if (this.activeElement) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.swordGlow;
            ctx.fillRect(-4, -28, 9, 35);
            ctx.globalAlpha = 1;
        }

        // Spitze
        ctx.fillStyle = this.swordColor;
        ctx.beginPath();
        ctx.moveTo(-1, -26);
        ctx.lineTo(2, -26);
        ctx.lineTo(0.5, -30);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
