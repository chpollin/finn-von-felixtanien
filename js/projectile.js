import { Entity } from './entity.js';
import { getElementColor, getElementGlow } from './elements.js';

/** Basis-Projektil: fliegt in eine Richtung und trifft Gegner */
export class Projectile extends Entity {
    constructor(x, y, vx, vy, element) {
        super(x, y);
        this.vx = vx;
        this.vy = vy;
        this.element = element;
        this.damage = 20;
        this.lifetime = 2;
        this.width = 12;
        this.height = 12;
        this.piercing = false; // Geht durch mehrere Gegner?
        this.hitSet = new Set(); // Bereits getroffene Entities
    }

    update(dt, game) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) { this.destroy(); return; }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Tile-Kollision → zerstören
        if (game.tilemap && game.tilemap.isSolidAtWorld(this.x + this.width / 2, this.y + this.height / 2)) {
            this.onHitWall(game);
            this.destroy();
            return;
        }

        // Gegner-Kollision
        for (const entity of game.entities) {
            if (entity === this || entity === game.player) continue;
            if (!entity.takeDamage) continue;
            if (entity.invincible) continue;
            if (this.hitSet.has(entity)) continue;

            if (this.collidesWith(entity)) {
                this.onHitEnemy(entity, game);
                this.hitSet.add(entity);
                if (!this.piercing) { this.destroy(); return; }
            }
        }
    }

    onHitEnemy(enemy, game) {
        enemy.takeDamage(this.damage, this.element);
        if (game.particles) {
            game.particles.emitHit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, getElementColor(this.element));
            game.particles.showDamage(enemy.x + enemy.width / 2, enemy.y - 8, this.damage, getElementColor(this.element));
        }
        if (game.audio) game.audio.play('hit');
        if (game.screenFx) game.screenFx.shake(3, 0.1);
    }

    onHitWall(game) {
        if (game.particles) {
            game.particles.emit(this.x, this.y, 6, {
                color: getElementColor(this.element), speed: 80, life: 0.3, size: 3
            });
        }
    }

    render(ctx) {
        ctx.fillStyle = getElementColor(this.element);
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// FEUERBALL — fliegt horizontal, macht Schaden
// ==========================================
export class Fireball extends Projectile {
    constructor(x, y, dirX) {
        super(x, y, dirX * 350, 0, 'fire');
        this.damage = 30;
        this.width = 14;
        this.height = 14;
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;
        super.update(dt, game);
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const flicker = Math.sin(this.timer * 20) * 2;

        // Flammen-Schweif
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(cx - this.vx * 0.02, cy, 10 + flicker, 0, Math.PI * 2);
        ctx.fill();

        // Kern
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();

        // Glühender Kern
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// WELLE — breite Welle, schiebt zurück, kein Schaden
// ==========================================
export class Wave extends Projectile {
    constructor(x, y, dirX) {
        super(x, y, dirX * 250, 0, 'water');
        this.damage = 0;
        this.pushForce = 400;
        this.width = 40;
        this.height = 32;
        this.lifetime = 0.6;
        this.piercing = true;
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;
        // Welle wird breiter mit der Zeit
        this.width = 40 + this.timer * 60;
        this.height = 32 + this.timer * 20;
        super.update(dt, game);
    }

    onHitEnemy(enemy, game) {
        // Kein Schaden, nur Pushback
        const dir = this.vx > 0 ? 1 : -1;
        enemy.vx = dir * this.pushForce;
        enemy.vy = -100;
        if (enemy.grounded !== undefined) enemy.grounded = false;

        if (game.particles) {
            game.particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, {
                color: '#44aaff', speed: 100, life: 0.3, size: 3
            });
        }
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const progress = this.timer / 0.6;

        ctx.globalAlpha = 0.7 * (1 - progress);
        ctx.fillStyle = '#0088ff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.4 * (1 - progress);
        ctx.fillStyle = '#44aaff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 - 5, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// ==========================================
// LIANE — verwurzelt Gegner (Stun) + Dornen-Schaden
// ==========================================
export class Vine extends Projectile {
    constructor(x, y, dirX) {
        super(x, y, dirX * 280, 0, 'earth');
        this.damage = 10;
        this.width = 16;
        this.height = 16;
        this.lifetime = 1.2;
        this.rootDuration = 2.0;
        this.thornDamage = 5;
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;
        // Leicht wellenförmige Flugbahn
        this.vy = Math.sin(this.timer * 8) * 40;
        super.update(dt, game);
    }

    onHitEnemy(enemy, game) {
        enemy.takeDamage(this.damage, this.element);
        enemy.vx = 0;
        enemy.vy = 0;

        // Root-Effekt: Feind kann sich nicht bewegen (dt-basiert)
        if (!enemy._rooted) {
            const origSpeed = enemy.speed;
            const origChaseSpeed = enemy.chaseSpeed;
            enemy.speed = 0;
            enemy.chaseSpeed = 0;
            enemy._rooted = true;
            enemy._rootTimer = this.rootDuration;
            enemy._thornTimer = 0;
            enemy._thornTicks = 0;
            enemy._thornDmg = this.thornDamage;
            enemy._rootOrigSpeed = origSpeed;
            enemy._rootOrigChase = origChaseSpeed;
            enemy._rootGame = game;

            // Dornen-Schaden über update-Hook
            const origUpdate = enemy.update.bind(enemy);
            enemy.update = (dt, g) => {
                origUpdate(dt, g);
                if (!enemy._rooted || !enemy.alive) return;
                enemy._rootTimer -= dt;
                enemy._thornTimer += dt;
                // Dornen-Tick alle 0.5s
                if (enemy._thornTimer >= 0.5 && enemy._thornTicks < 4) {
                    enemy._thornTimer = 0;
                    enemy._thornTicks++;
                    enemy.takeDamage(enemy._thornDmg, 'earth');
                    if (g.particles) {
                        g.particles.showDamage(enemy.x + enemy.width / 2, enemy.y - 8, enemy._thornDmg, '#88aa00');
                    }
                }
                // Root abgelaufen
                if (enemy._rootTimer <= 0) {
                    enemy.speed = enemy._rootOrigSpeed;
                    enemy.chaseSpeed = enemy._rootOrigChase;
                    enemy._rooted = false;
                    enemy.update = origUpdate;
                }
            };
        }

        if (game.particles) {
            game.particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height, 12, {
                color: '#88aa00', speed: 50, life: 0.5, size: 4
            });
            game.particles.showDamage(enemy.x + enemy.width / 2, enemy.y - 20, 'Verwurzelt!', '#aacc44');
        }
        if (game.audio) game.audio.play('hit');
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Ranken
        ctx.strokeStyle = '#88aa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy);
        ctx.quadraticCurveTo(cx, cy - 6, cx + 8, cy);
        ctx.stroke();

        // Dornen
        ctx.fillStyle = '#aacc44';
        ctx.fillRect(cx - 2, cy - 5, 4, 4);
        ctx.fillRect(cx + 4, cy - 3, 3, 3);
        ctx.fillRect(cx - 6, cy + 1, 3, 3);

        // Blatt
        ctx.fillStyle = '#66aa00';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// TORNADO — Wirbel der Gegner hochschleudert
// ==========================================
export class Tornado extends Projectile {
    constructor(x, y, dirX) {
        super(x, y, dirX * 200, 0, 'air');
        this.damage = 15;
        this.launchForce = -450;
        this.width = 20;
        this.height = 36;
        this.lifetime = 1.5;
        this.piercing = true;
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;
        super.update(dt, game);
    }

    onHitEnemy(enemy, game) {
        enemy.takeDamage(this.damage, this.element);
        // Hochschleudern!
        enemy.vy = this.launchForce;
        enemy.vx = this.vx * 0.3;
        if (enemy.grounded !== undefined) enemy.grounded = false;

        if (game.particles) {
            game.particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, {
                color: '#aaeeff', speed: 150, life: 0.5, size: 3,
                angle: -Math.PI / 2, spread: Math.PI * 0.5
            });
            game.particles.showDamage(enemy.x + enemy.width / 2, enemy.y - 20, '↑↑↑', '#ccffff');
        }
        if (game.audio) game.audio.play('hit');
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const spin = this.timer * 10;

        // Wirbel-Ringe (von unten nach oben, kleiner werdend)
        for (let i = 0; i < 5; i++) {
            const ry = cy + 14 - i * 7;
            const rx = cx + Math.sin(spin + i * 1.2) * (6 - i);
            const r = 10 - i * 1.5;
            ctx.globalAlpha = 0.6 - i * 0.08;
            ctx.strokeStyle = '#aaeeff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(rx, ry, r, r * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Innerer Kern
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ccffff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 5, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// ==========================================
// FLUCH — markiert nächsten Gegner für 2x Schaden
// ==========================================
export class Curse extends Projectile {
    constructor(x, y, dirX) {
        super(x, y, dirX * 300, 0, 'dark');
        this.damage = 5; // Leichter Initial-Schaden
        this.curseDuration = 4;
        this.width = 14;
        this.height = 14;
        this.lifetime = 1.5;
        this.timer = 0;
    }

    update(dt, game) {
        this.timer += dt;
        // Leicht wellenförmig
        this.vy = Math.sin(this.timer * 6) * 30;
        super.update(dt, game);
    }

    onHitEnemy(enemy, game) {
        enemy.takeDamage(this.damage, this.element);

        // Fluch anwenden: Doppelter Schaden (dt-basiert)
        if (!enemy._cursed) {
            enemy._cursed = true;
            enemy._curseTimer = this.curseDuration;
            const origTakeDamage = enemy.takeDamage.bind(enemy);
            enemy.takeDamage = (amount, element) => {
                return origTakeDamage(amount * 2, element);
            };

            // Fluch-Timer via update-Hook
            const origUpdate = enemy.update.bind(enemy);
            enemy.update = (dt, g) => {
                origUpdate(dt, g);
                if (!enemy._cursed || !enemy.alive) return;
                enemy._curseTimer -= dt;
                if (enemy._curseTimer <= 0) {
                    enemy.takeDamage = origTakeDamage;
                    enemy._cursed = false;
                    enemy.update = origUpdate;
                }
            };
        }

        if (game.particles) {
            game.particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, {
                color: '#8844cc', speed: 80, life: 0.8, size: 4
            });
            game.particles.showDamage(enemy.x + enemy.width / 2, enemy.y - 20, 'Verflucht!', '#aa66ee');
        }
        if (game.audio) game.audio.play('hit');
    }

    render(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const pulse = Math.sin(this.timer * 12) * 3;

        // Schatten-Aura
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#6600aa';
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Kern
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8844cc';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Auge im Inneren
        ctx.fillStyle = '#cc66ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#220044';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
}

// ==========================================
// LASER — Lichtsäule von oben
// ==========================================
export class LightBeam extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 24;
        this.height = 600; // Ganze Bildschirmhöhe
        this.element = 'light';
        this.damage = 35;
        this.lifetime = 0.4;
        this.maxLifetime = 0.4;
        this.y = 0; // Von ganz oben
        this.targetX = x;
        this.hasHit = new Set();
        this.warningTime = 0.3; // Vorwarnung bevor Strahl erscheint
        this.warningTimer = 0.3;
        this.active = false;
    }

    update(dt, game) {
        if (this.warningTimer > 0) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) this.active = true;
            return;
        }

        this.lifetime -= dt;
        if (this.lifetime <= 0) { this.destroy(); return; }

        // Gegner treffen
        for (const entity of game.entities) {
            if (entity === this || entity === game.player) continue;
            if (!entity.takeDamage || entity.invincible) continue;
            if (this.hasHit.has(entity)) continue;

            // Prüfe ob Gegner in der Säule ist (nur X-Achse relevant)
            if (entity.x + entity.width > this.targetX - this.width / 2 &&
                entity.x < this.targetX + this.width / 2) {
                entity.takeDamage(this.damage, this.element);
                this.hasHit.add(entity);

                if (game.particles) {
                    game.particles.emitHit(entity.x + entity.width / 2, entity.y, '#ffee00');
                    game.particles.showDamage(entity.x + entity.width / 2, entity.y - 16, this.damage, '#ffff88');
                }
                if (game.audio) game.audio.play('hit');
                if (game.screenFx) game.screenFx.shake(5, 0.15);
                if (game.screenFx) game.screenFx.flash('#ffee00', 0.1);
            }
        }
    }

    render(ctx) {
        const cx = this.targetX;

        if (!this.active) {
            // Vorwarnung: blinkende Linie
            const blink = Math.sin(this.warningTimer * 40) > 0;
            if (blink) {
                ctx.globalAlpha = 0.4;
                ctx.strokeStyle = '#ffee00';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(cx, 0);
                ctx.lineTo(cx, 1000);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }
            return;
        }

        const progress = 1 - (this.lifetime / this.maxLifetime);
        const alpha = 1 - progress * 0.5;
        const beamW = this.width * (1 - progress * 0.3);

        // Äußerer Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#ffee00';
        ctx.fillRect(cx - beamW, 0, beamW * 2, 1000);

        // Hauptstrahl
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(cx - beamW / 2, 0, beamW, 1000);

        // Innerer heller Kern
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - beamW / 4, 0, beamW / 2, 1000);

        ctx.globalAlpha = 1;
    }
}

// ==========================================
// Factory-Funktion: erstellt Fernattacke basierend auf Element
// ==========================================
export function createRangedAttack(player, element, game) {
    const dir = player.facingRight ? 1 : -1;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2 - 4;

    switch (element) {
        case 'fire':
            return new Fireball(px, py - 6, dir);
        case 'water':
            return new Wave(px + dir * 10, py - 8, dir);
        case 'earth':
            return new Vine(px, py, dir);
        case 'air':
            return new Tornado(px + dir * 5, py - 16, dir);
        case 'dark':
            return new Curse(px, py, dir);
        case 'light': {
            // Laser fällt ein Stück vor dem Spieler herunter
            const beamX = px + dir * 120;
            return new LightBeam(beamX, 0);
        }
        default:
            return new Fireball(px, py, dir);
    }
}
