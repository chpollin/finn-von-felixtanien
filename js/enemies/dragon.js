import { Entity } from '../entity.js';

const DRAGON_QUOTES = {
    1: [
        'GRAAAAAH!',
        'Das Mädchen\ngehört MIR!',
        'Du wagst es,\nmir zu folgen?!',
        'Ich verbrenne\ndich, kleiner König!',
    ],
    2: [
        'ZWEI KÖPFE!\nDoppelte Macht!',
        'Feuer UND Erde —\nbesiege das mal!',
        'Brennen ODER\nverschluckt werden!',
        'Du hast keine Chance!',
    ],
    3: [
        'DREI KÖPFE!!!',
        'ALLE Elemente\nsind in mir!',
        'GRAAAAAH RAAAAH!!',
        'Jetzt STIRBST du!',
        'DIESE WELT\nWIRD MEIN!',
    ],
};

// Drache: 3-Phasen-Endboss, mehrköpfig, fliegend
export class Dragon extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 120;
        this.height = 80;

        this.health = 500;
        this.maxHealth = 500;
        this.element = null;
        this.phase = 1;
        this.defeated = false;

        // Schwellen (per Difficulty überschreibbar)
        this.phase2Threshold = 0.6;
        this.phase3Threshold = 0.3;

        // i-Frames
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.25;

        // Multiplikatoren (von playing-state gesetzt)
        this._damageMult = 1;

        // Flugverhalten
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        this.flyTimer = 0;
        this.flyMode = 'circle'; // circle, swoop, retreat
        this.swoopTimer = 0;
        this.facingRight = false;

        // Animation
        this.timer = 0;
        this.wingFlap = 0;
        this.bodyFlex = 0;

        // Köpfe (1 in Phase 1, 2 in Phase 2, 3 in Phase 3)
        // Element pro Kopf bestimmt Schwäche (Spieler nutzt das gegen-Element)
        this.heads = [
            { element: 'fire', cooldown: 0, anim: 0 },
        ];

        // Sprüche
        this.quoteTimer = 1;
        this.currentQuote = '';
        this.quoteDisplay = 0;
        this.usedQuotes = [];

        // Tod
        this.deathTimer = 0;
        this.deathDuration = 2;
    }

    getQuote() {
        const pool = DRAGON_QUOTES[this.phase] || DRAGON_QUOTES[1];
        if (this.usedQuotes.length >= pool.length) this.usedQuotes = [];
        const avail = pool.filter((_, i) => !this.usedQuotes.includes(i));
        const pick = avail[Math.floor(Math.random() * avail.length)];
        this.usedQuotes.push(pool.indexOf(pick));
        return pick;
    }

    update(dt, game) {
        if (this.defeated) {
            this.deathTimer += dt;
            this.vy += 200 * dt; // fällt
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            // Tod-Partikel
            if (game.particles && Math.random() < 0.5) {
                game.particles.emit(
                    this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                    this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                    3,
                    { color: '#ff6644', speed: 80, life: 0.6, size: 4 }
                );
            }
            if (this.deathTimer >= this.deathDuration) {
                this.alive = false;
            }
            return;
        }

        this.timer += dt;
        this.wingFlap += dt * 6;
        this.bodyFlex += dt * 2;

        // i-Frames
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Sprüche
        this.quoteTimer -= dt;
        if (this.quoteDisplay > 0) this.quoteDisplay -= dt;
        if (this.quoteTimer <= 0) {
            this.quoteTimer = 5 + Math.random() * 4;
            this.currentQuote = this.getQuote();
            this.quoteDisplay = 2.5;
        }

        // Phasen-Wechsel
        const hpRatio = this.health / this.maxHealth;
        if (hpRatio <= this.phase3Threshold && this.phase < 3) {
            this.phase = 3;
            this.onPhaseChange(3, game);
        } else if (hpRatio <= this.phase2Threshold && this.phase < 2) {
            this.phase = 2;
            this.onPhaseChange(2, game);
        }

        // KI: kreist um den Spieler, schwingt manchmal heran, attackiert
        if (game.player) {
            this.facingRight = game.player.x > this.x;

            this.flyTimer += dt;
            if (this.flyMode === 'circle') {
                // Kreist auf einer Sinus-Bahn um den Spieler
                const orbitR = 220 + Math.sin(this.timer * 0.5) * 40;
                const angle = this.timer * 0.6;
                this.targetX = game.player.x - orbitR * Math.cos(angle);
                this.targetY = game.player.y - 60 + Math.sin(angle * 2) * 50;

                // Hin und wieder schwingen lassen
                if (this.flyTimer > 4 + Math.random() * 2) {
                    this.flyMode = 'swoop';
                    this.swoopTimer = 1.2;
                    this.flyTimer = 0;
                }
            } else if (this.flyMode === 'swoop') {
                // Sturzflug auf Spieler-Höhe
                this.targetX = game.player.x + (this.facingRight ? -100 : 100);
                this.targetY = game.player.y + 20;
                this.swoopTimer -= dt;

                // Kontakt-Schaden im Sturzflug
                if (game.player && this.collidesWith(game.player) && !game.player.invincible) {
                    game.player.takeDamage(Math.round(15 * this._damageMult), null, game);
                    if (game.screenFx) game.screenFx.shake(6, 0.2);
                }

                if (this.swoopTimer <= 0) {
                    this.flyMode = 'circle';
                    this.flyTimer = 0;
                }
            }

            // Sanftes Verfolgen des Targets
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const accel = this.flyMode === 'swoop' ? 8 : 3;
            this.vx += dx * dt * accel;
            this.vy += dy * dt * accel;
            // Dämpfung
            this.vx *= 0.92;
            this.vy *= 0.92;

            // Geschwindigkeits-Limit
            const maxSpeed = this.flyMode === 'swoop' ? 380 : 220;
            const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (sp > maxSpeed) {
                this.vx = (this.vx / sp) * maxSpeed;
                this.vy = (this.vy / sp) * maxSpeed;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Im Level halten
        if (game.tilemap) {
            this.x = Math.max(20, Math.min(game.tilemap.widthPx - this.width - 20, this.x));
            this.y = Math.max(20, Math.min(game.tilemap.heightPx - this.height - 80, this.y));
        }

        // Köpfe attackieren
        for (const head of this.heads) {
            head.cooldown -= dt;
            head.anim += dt;
            if (head.cooldown <= 0 && game.player) {
                this.headAttack(head, game);
                head.cooldown = 2.0 + Math.random() * 1.0;
            }
        }
    }

    headAttack(head, game) {
        const dir = this.facingRight ? 1 : -1;
        const sx = this.x + this.width / 2 + dir * 50;
        const sy = this.y + this.height / 2 - 10;

        // Element-Projektil schießen
        const dx = (game.player.x + game.player.width / 2) - sx;
        const dy = (game.player.y + game.player.height / 2) - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 280;
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;

        const proj = new DragonBreath(sx, sy, vx, vy, head.element, this._damageMult || 1);
        game.addEntity(proj);

        if (game.particles) {
            const colors = { fire: '#ff4400', water: '#44aaff', earth: '#88aa44', air: '#aaeeff', dark: '#8844cc', light: '#ffee44' };
            game.particles.emit(sx, sy, 8, {
                color: colors[head.element] || '#fff', speed: 100, life: 0.4, size: 3
            });
        }
    }

    onPhaseChange(newPhase, game) {
        this.usedQuotes = [];
        if (newPhase === 2) {
            // 2 Köpfe: Feuer + Erde
            this.heads = [
                { element: 'fire', cooldown: 0.5, anim: 0 },
                { element: 'earth', cooldown: 1.5, anim: 0 },
            ];
            this.width = 140;
            this.height = 90;
            this.currentQuote = 'ZWEI KÖPFE!\nDoppelte Macht!';
        } else if (newPhase === 3) {
            // 3 Köpfe: Feuer + Erde + Dunkel
            this.heads = [
                { element: 'fire', cooldown: 0.4, anim: 0 },
                { element: 'earth', cooldown: 1.0, anim: 0 },
                { element: 'dark', cooldown: 1.6, anim: 0 },
            ];
            this.width = 160;
            this.height = 100;
            this.currentQuote = 'DREI KÖPFE!!!\nALLE Elemente\nsind in mir!';
        }
        this.quoteDisplay = 3;
        if (game.screenFx) game.screenFx.shake(12, 0.6);
        if (game.screenFx) game.screenFx.flash(newPhase === 3 ? '#ff0000' : '#ff8800', 0.4);
        if (game.particles) {
            game.particles.emit(this.x + this.width / 2, this.y + this.height / 2, 50, {
                color: newPhase === 3 ? '#aa00ff' : '#ff4400', speed: 250, life: 1, size: 6
            });
        }
    }

    takeDamage(amount, element = null) {
        if (this.defeated || this.invincible) return 0;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        if (this.health <= 0) {
            this.health = 0;
            this.defeated = true;
            this.currentQuote = 'NEEEIN!\nUnmöglich...!';
            this.quoteDisplay = 3;
            this.vx = 0;
            this.vy = -50;
        }
        return amount;
    }

    render(ctx) {
        if (this.defeated && this.deathTimer >= this.deathDuration) return;

        if (this.invincible && Math.floor(this.invincibleTimer * 18) % 2 === 0) ctx.globalAlpha = 0.4;
        if (this.defeated) ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / this.deathDuration);

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const w = this.width;
        const h = this.height;

        ctx.save();
        const cx = x + w / 2;
        if (!this.facingRight) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }

        const wingY = Math.sin(this.wingFlap) * 8;
        const bodyY = Math.sin(this.bodyFlex) * 3;

        // Schatten unter Drache
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, y + h + 30, w * 0.4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hinterer Flügel
        const wingColor = this.phase === 3 ? '#3a0a3a' : this.phase === 2 ? '#5a1a1a' : '#6a2a1a';
        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y + h * 0.3 + bodyY);
        ctx.lineTo(x + w * 0.2, y - 30 + wingY);
        ctx.lineTo(x + w * 0.05, y - 10 + wingY);
        ctx.lineTo(x + w * 0.15, y + h * 0.4 + bodyY);
        ctx.closePath();
        ctx.fill();

        // Körper
        const bodyColor = this.phase === 3 ? '#4a1a4a' : this.phase === 2 ? '#7a2a1a' : '#8a3a1a';
        const bodyHighlight = this.phase === 3 ? '#7a3a8a' : this.phase === 2 ? '#aa4a2a' : '#bb5a2a';

        // Schwanz
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.05, y + h * 0.5 + bodyY);
        ctx.lineTo(x - 20, y + h * 0.55 + Math.sin(this.timer * 3) * 10);
        ctx.lineTo(x - 35, y + h * 0.45 + Math.sin(this.timer * 3 + 1) * 12);
        ctx.lineTo(x - 30, y + h * 0.65);
        ctx.lineTo(x + w * 0.1, y + h * 0.7 + bodyY);
        ctx.closePath();
        ctx.fill();
        // Schwanzspitze (gefährlich)
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(x - 35, y + h * 0.45 + Math.sin(this.timer * 3 + 1) * 12);
        ctx.lineTo(x - 50, y + h * 0.5);
        ctx.lineTo(x - 35, y + h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Hauptkörper
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(cx - 5, y + h * 0.55 + bodyY, w * 0.4, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bauch (heller)
        ctx.fillStyle = bodyHighlight;
        ctx.beginPath();
        ctx.ellipse(cx - 5, y + h * 0.6 + bodyY, w * 0.32, h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bauch-Schuppen-Muster
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + w * 0.25, y + h * 0.5 + i * 5 + bodyY);
            ctx.lineTo(x + w * 0.55, y + h * 0.5 + i * 5 + bodyY);
            ctx.stroke();
        }

        // Beine
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + w * 0.2, y + h * 0.7 + bodyY, 12, 18);
        ctx.fillRect(x + w * 0.45, y + h * 0.7 + bodyY, 12, 18);
        // Krallen
        ctx.fillStyle = '#ddd';
        for (let lx of [x + w * 0.2, x + w * 0.45]) {
            ctx.beginPath();
            ctx.moveTo(lx, y + h * 0.7 + bodyY + 18);
            ctx.lineTo(lx + 4, y + h * 0.7 + bodyY + 22);
            ctx.lineTo(lx + 8, y + h * 0.7 + bodyY + 18);
            ctx.lineTo(lx + 12, y + h * 0.7 + bodyY + 22);
            ctx.lineTo(lx + 12, y + h * 0.7 + bodyY + 18);
            ctx.closePath();
            ctx.fill();
        }

        // Vorderer Flügel (groß, animiert)
        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.45, y + h * 0.35 + bodyY);
        ctx.lineTo(x + w * 0.3, y - 40 - wingY);
        ctx.lineTo(x + w * 0.15, y - 20 - wingY);
        ctx.lineTo(x + w * 0.25, y + h * 0.45 + bodyY);
        ctx.closePath();
        ctx.fill();
        // Flügel-Adern
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y + h * 0.4 + bodyY);
        ctx.lineTo(x + w * 0.28, y - 25 - wingY);
        ctx.stroke();

        // Köpfe rendern (1, 2 oder 3)
        this.renderHeads(ctx, x, y, w, h, bodyY);

        ctx.restore();

        // Sprechblase
        this.renderQuote(ctx, x, y, w);

        ctx.globalAlpha = 1;
    }

    renderHeads(ctx, x, y, w, h, bodyY) {
        const headCount = this.heads.length;
        // Hals-Basis
        const neckBaseX = x + w * 0.65;
        const neckBaseY = y + h * 0.4 + bodyY;

        for (let i = 0; i < headCount; i++) {
            const head = this.heads[i];
            const angleSpread = (headCount - 1) * 0.4;
            const angle = -angleSpread / 2 + i * 0.4;
            const sway = Math.sin(this.timer * 2 + i) * 0.15;
            const finalAngle = angle + sway;

            const neckLen = 35 + i * 8;
            const headX = neckBaseX + Math.cos(finalAngle) * neckLen + Math.sin(this.timer * 3 + i) * 5;
            const headY = neckBaseY + Math.sin(finalAngle) * neckLen - 20;

            this.renderSingleHead(ctx, headX, headY, neckBaseX, neckBaseY, head, finalAngle);
        }
    }

    renderSingleHead(ctx, hx, hy, nbx, nby, head, angle) {
        // Hals (mehrere Segmente)
        const segments = 5;
        for (let s = 0; s < segments; s++) {
            const t = (s + 1) / (segments + 1);
            const sx = nbx + (hx - nbx) * t;
            const sy = nby + (hy - nby) * t;
            const r = 10 - s * 1.2;
            ctx.fillStyle = this.getHeadColor(head.element, false);
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Kopf-Glow (Element-Farbe)
        const glowColor = this.getHeadColor(head.element, true);
        ctx.globalAlpha = 0.4 + Math.sin(this.timer * 4 + head.anim * 2) * 0.2;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(hx, hy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Kopf-Hauptform
        const headColor = this.getHeadColor(head.element, false);
        ctx.fillStyle = headColor;
        // Schnauze
        ctx.beginPath();
        ctx.ellipse(hx + 12, hy, 16, 10, angle, 0, Math.PI * 2);
        ctx.fill();
        // Schädel
        ctx.beginPath();
        ctx.arc(hx, hy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Hörner
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy - 8);
        ctx.lineTo(hx - 14, hy - 22);
        ctx.lineTo(hx - 4, hy - 12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy - 10);
        ctx.lineTo(hx + 2, hy - 24);
        ctx.lineTo(hx + 10, hy - 12);
        ctx.closePath();
        ctx.fill();

        // Augen (glühend in Element-Farbe)
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(hx + 4, hy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(hx + 5, hy - 4, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Nasenlöcher
        ctx.fillStyle = '#1a0a0a';
        ctx.beginPath();
        ctx.arc(hx + 22, hy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + 22, hy + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Zähne
        ctx.fillStyle = '#fff';
        ctx.fillRect(hx + 18, hy + 4, 1.5, 4);
        ctx.fillRect(hx + 22, hy + 4, 1.5, 4);
        ctx.fillRect(hx + 14, hy + 4, 1.5, 3);

        // Element-Anzeige (kleines Icon über Kopf)
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(hx, hy - 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Atem-Aufladung wenn Cooldown niedrig
        if (head.cooldown < 0.3 && head.cooldown > 0) {
            const charge = 1 - head.cooldown / 0.3;
            ctx.globalAlpha = charge;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(hx + 22, hy, 3 + charge * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    getHeadColor(element, glow) {
        if (glow) {
            switch (element) {
                case 'fire': return '#ff6622';
                case 'water': return '#44aaff';
                case 'earth': return '#aacc66';
                case 'air': return '#ddffff';
                case 'dark': return '#aa44ee';
                case 'light': return '#ffee88';
            }
            return '#fff';
        }
        switch (element) {
            case 'fire': return '#aa3a1a';
            case 'water': return '#1a4a8a';
            case 'earth': return '#5a7a3a';
            case 'air': return '#7a9aaa';
            case 'dark': return '#3a1a5a';
            case 'light': return '#aaaa3a';
        }
        return '#5a3a2a';
    }

    renderQuote(ctx, x, y, w) {
        if (this.quoteDisplay <= 0 || !this.currentQuote) return;
        const lines = this.currentQuote.split('\n');
        const maxW = lines.reduce((m, l) => Math.max(m, l.length * 9), 0);
        const bw = maxW + 24;
        const bh = lines.length * 18 + 16;
        const bx = x + w / 2 - bw / 2;
        const by = y - bh - 28;
        const alpha = Math.min(1, this.quoteDisplay);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.phase === 3 ? '#1a0030' : this.phase === 2 ? '#2a0a00' : '#1a0a0a';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = this.phase === 3 ? '#aa00ff' : this.phase === 2 ? '#ff6600' : '#cc4422';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = this.phase === 3 ? '#ee88ff' : this.phase === 2 ? '#ffaa66' : '#ffaa66';
        ctx.font = `bold ${this.phase === 3 ? 14 : 13}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + w / 2, by + 18 + i * 18);
        }
        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
    }

    renderBossBar(ctx, screenWidth) {
        if (this.defeated) return;
        const barW = 360;
        const barH = 16;
        const bx = (screenWidth - barW) / 2;
        const by = 10;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const phaseText = this.phase === 3 ? ' [3 KÖPFE]' : this.phase === 2 ? ' [2 KÖPFE]' : '';
        ctx.fillText(`Drache${phaseText}`, screenWidth / 2, by + barH + 22);

        ctx.fillStyle = '#400';
        ctx.fillRect(bx, by, barW, barH);
        const ratio = this.health / this.maxHealth;
        const color = this.phase === 3 ? '#aa00ff' : this.phase === 2 ? '#ff6600' : '#dd4422';
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, barW * ratio, barH);

        // Phasen-Markierungen
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + barW * this.phase2Threshold, by); ctx.lineTo(bx + barW * this.phase2Threshold, by + barH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + barW * this.phase3Threshold, by); ctx.lineTo(bx + barW * this.phase3Threshold, by + barH); ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.strokeRect(bx, by, barW, barH);
        ctx.textAlign = 'start';
    }
}

// Drachen-Atem-Projektil (element-spezifisch)
export class DragonBreath extends Entity {
    constructor(x, y, vx, vy, element, dmgMult = 1) {
        super(x, y);
        this.width = 18;
        this.height = 18;
        this.vx = vx;
        this.vy = vy;
        this.element = element;
        this.damage = Math.round(18 * dmgMult);
        this.lifetime = 3;
        this.timer = 0;
        this.alive = true;
    }

    update(dt, game) {
        this.timer += dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0) { this.destroy(); return; }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wand-Kollision
        if (game.tilemap && game.tilemap.isSolidAtWorld(this.x + 9, this.y + 9)) {
            if (game.particles) {
                game.particles.emit(this.x + 9, this.y + 9, 8, {
                    color: this.color(true), speed: 80, life: 0.4, size: 3
                });
            }
            this.destroy();
            return;
        }

        // Spieler treffen
        if (game.player && !game.player.invincible && this.collidesWith(game.player)) {
            game.player.takeDamage(this.damage, this.element, game);
            if (game.particles) {
                game.particles.emitHit(game.player.x + game.player.width / 2, game.player.y + 10, this.color(true));
            }
            if (game.screenFx) game.screenFx.shake(4, 0.15);
            this.destroy();
        }
    }

    color(glow) {
        if (glow) {
            return { fire: '#ff8844', water: '#66ccff', earth: '#aaee66', air: '#ddffff', dark: '#cc66ff', light: '#ffffaa' }[this.element] || '#fff';
        }
        return { fire: '#cc3300', water: '#3388cc', earth: '#669933', air: '#88aabb', dark: '#6622aa', light: '#cccc33' }[this.element] || '#aaa';
    }

    render(ctx) {
        const cx = this.x + 9;
        const cy = this.y + 9;
        const pulse = Math.sin(this.timer * 18) * 2;
        // Glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.color(true);
        ctx.beginPath();
        ctx.arc(cx, cy, 14 + pulse, 0, Math.PI * 2);
        ctx.fill();
        // Kern
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = this.color(true);
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        // Innerer Kern
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        // Schweif
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.color(false);
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx - this.vx * 0.005 * i, cy - this.vy * 0.005 * i, 5 - i, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
