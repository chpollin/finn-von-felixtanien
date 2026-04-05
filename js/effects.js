class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt; // leichte Schwerkraft
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    render(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size, this.size
        );
        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    /** Partikel-Burst erzeugen */
    emit(x, y, count, options = {}) {
        const {
            color = '#fff',
            speed = 100,
            life = 0.5,
            size = 3,
            spread = Math.PI * 2,
            angle = 0,
            gravity = true,
        } = options;

        for (let i = 0; i < count; i++) {
            const a = angle - spread / 2 + Math.random() * spread;
            const s = speed * (0.5 + Math.random() * 0.5);
            const p = new Particle(
                x, y,
                Math.cos(a) * s,
                Math.sin(a) * s,
                color,
                life * (0.7 + Math.random() * 0.6),
                size * (0.5 + Math.random())
            );
            if (!gravity) p.vy = Math.sin(a) * s; // keine Extra-Schwerkraft
            this.particles.push(p);
        }
    }

    /** Schwerthieb-Bogen (Slash-Effekt) */
    emitSlash(x, y, facingRight, color = '#fff') {
        const dir = facingRight ? 0 : Math.PI;
        this.emit(x, y, 8, {
            color,
            speed: 150,
            life: 0.2,
            size: 4,
            spread: Math.PI * 0.8,
            angle: dir - Math.PI * 0.4,
        });
    }

    /** Treffer-Funken */
    emitHit(x, y, color = '#ff4') {
        this.emit(x, y, 12, {
            color,
            speed: 180,
            life: 0.35,
            size: 3,
        });
    }

    /** Schwebender Schadenstext */
    showDamage(x, y, amount, color = '#fff') {
        this.floatingTexts.push({
            x, y,
            text: String(amount),
            color,
            life: 0.8,
            maxLife: 0.8,
            vy: -60,
        });
    }

    update(dt) {
        // Partikel updaten
        for (const p of this.particles) {
            p.update(dt);
        }
        this.particles = this.particles.filter(p => p.alive);

        // Schwebende Texte updaten
        for (const t of this.floatingTexts) {
            t.y += t.vy * dt;
            t.life -= dt;
        }
        this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    }

    render(ctx) {
        // Partikel
        for (const p of this.particles) {
            p.render(ctx);
        }

        // Schwebende Schadenszahlen
        for (const t of this.floatingTexts) {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.textAlign = 'start';
            ctx.globalAlpha = 1;
        }
    }
}
