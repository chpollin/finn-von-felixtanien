import { Entity } from '../entity.js';

const GRUMP_QUOTES = [
    'Geh WEG!',
    'Ich HASSE\nSonnenschein!',
    'Regen ist\ndie BESTE Laune!',
    'Hör auf\nzu lächeln!',
    '*grummel*',
    'DONNER-\nWETTER!',
    'Tornados sind\nSO nervig!',
    'Blitz und\nSchwefel!',
    'Warum fliegst du\nHIER rum?!',
    'Ich bin eine\nWOLKE, keine\nZuckerwatte!',
    'BRRRZZT!',
    'Spaß? Was ist\ndas?!',
];

/**
 * Grummelige Gewitterwolke — fliegt, schießt Blitze, meckert.
 * Das Gegenteil des lustigen Tornado-Reittiers.
 */
export class CloudGrump extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 48;
        this.height = 32;
        this.health = 35;
        this.maxHealth = 35;
        this.damage = 12;
        this.element = 'air';

        // Flug-KI
        this.baseY = y;
        this.flyDir = 1;
        this.flyRange = 120;
        this.flyOrigin = x;
        this.speed = 70;
        this.timer = Math.random() * 10;

        // Blitz-Attacke
        this.lightningCooldown = 0;
        this.lightningCooldownMax = 3;
        this.lightningActive = false;
        this.lightningTimer = 0;
        this.lightningX = 0;

        // Mecker-Sprüche
        this.quoteTimer = 2 + Math.random() * 3;
        this.currentQuote = '';
        this.quoteDisplay = 0;
        this.usedIdx = [];

        // Visuell
        this.angry = false;
        this._angryTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.3;
        this.alive = true;
        this.deathTimer = 0;
        this.isDying = false;
    }

    getQuote() {
        if (this.usedIdx.length >= GRUMP_QUOTES.length) this.usedIdx = [];
        const avail = GRUMP_QUOTES.filter((_, i) => !this.usedIdx.includes(i));
        const pick = avail[Math.floor(Math.random() * avail.length)];
        this.usedIdx.push(GRUMP_QUOTES.indexOf(pick));
        return pick;
    }

    update(dt, game) {
        if (this.isDying) {
            this.deathTimer += dt;
            if (this.deathTimer > 0.5) this.destroy();
            return;
        }

        this.timer += dt;

        // Angry-Timer (dt-basiert statt setTimeout)
        if (this._angryTimer > 0) {
            this._angryTimer -= dt;
            if (this._angryTimer <= 0) this.angry = false;
        }

        // i-Frames
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Sprüche
        this.quoteTimer -= dt;
        if (this.quoteDisplay > 0) this.quoteDisplay -= dt;
        if (this.quoteTimer <= 0) {
            this.quoteTimer = 4 + Math.random() * 4;
            this.currentQuote = this.getQuote();
            this.quoteDisplay = 2.5;
        }

        // Hin und her fliegen
        this.x += this.flyDir * this.speed * dt;
        if (this.x > this.flyOrigin + this.flyRange) this.flyDir = -1;
        if (this.x < this.flyOrigin - this.flyRange) this.flyDir = 1;

        // Auf und ab schweben
        this.y = this.baseY + Math.sin(this.timer * 1.5) * 15;

        // Blitz-Attacke
        this.lightningCooldown -= dt;
        if (this.lightningActive) {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.lightningActive = false;
            }
            // Spieler treffen wenn in Blitz-Spalte
            if (game.player && !game.player.invincible) {
                const px = game.player.x + game.player.width / 2;
                if (Math.abs(px - this.lightningX) < 16 && game.player.y > this.y) {
                    game.player.takeDamage(this.damage, null, game);
                    if (game.player.vy !== undefined) {
                        game.player.vy = -100;
                    }
                    if (game.screenFx) game.screenFx.flash('#ffff00', 0.1);
                    if (game.screenFx) game.screenFx.shake(4, 0.15);
                }
            }
        }

        // Neuen Blitz auslösen wenn Spieler unter der Wolke ist
        if (this.lightningCooldown <= 0 && game.player) {
            const px = game.player.x + game.player.width / 2;
            const cx = this.x + this.width / 2;
            if (Math.abs(px - cx) < 80 && game.player.y > this.y) {
                this.lightningActive = true;
                this.lightningTimer = 0.3;
                this.lightningX = cx;
                this.lightningCooldown = this.lightningCooldownMax;
                this.angry = true;
                this.currentQuote = 'BRRRZZT!';
                this.quoteDisplay = 1;
                if (game.audio) game.audio.play('hit');
                this._angryTimer = 0.5;
            }
        }

        // Kontaktschaden
        if (game.player && this.collidesWith(game.player) && !game.player.invincible) {
            game.player.takeDamage(this.damage, null, game);
            game.player.vy = -150;
            game.player.grounded = false;
        }
    }

    takeDamage(amount, element) {
        if (this.invincible || this.isDying) return 0;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;

        // Wütend werden beim Treffer
        this.currentQuote = 'AUTSCH! Das\nwar GEMEIN!';
        this.quoteDisplay = 2;

        if (this.health <= 0) {
            this.health = 0;
            this.isDying = true;
            this.currentQuote = 'Ich...löse\nmich...auf...';
            this.quoteDisplay = 1;
        }
        return amount;
    }

    render(ctx) {
        if (this.isDying) {
            ctx.globalAlpha = 1 - (this.deathTimer / 0.5);
        }
        if (this.invincible && !this.isDying && Math.floor(this.invincibleTimer * 12) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const cx = x + this.width / 2;

        // --- Blitz ---
        if (this.lightningActive) {
            const lx = this.lightningX;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(lx, y + this.height);
            // Zick-Zack nach unten
            let ly = y + this.height;
            for (let i = 0; i < 8; i++) {
                ly += 40;
                const zag = (i % 2 === 0 ? 1 : -1) * (8 + Math.random() * 8);
                ctx.lineTo(lx + zag, ly);
            }
            ctx.stroke();
            // Breiterer Glow
            ctx.strokeStyle = '#ffff88';
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // --- Wolken-Körper ---
        const cloudColor = this.angry ? '#5a5a6a' : '#7a7a8a';
        const darkColor = this.angry ? '#3a3a4a' : '#5a5a6a';

        // Untere Basis
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(cx, y + 24, 26, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Haupt-Wolke
        ctx.fillStyle = cloudColor;
        ctx.beginPath();
        ctx.arc(cx - 10, y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 10, y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, y + 8, 16, 0, Math.PI * 2);
        ctx.fill();

        // --- Grummeliges Gesicht ---
        // Augenbrauen (wütend, nach innen geneigt)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12, y + 6);
        ctx.lineTo(cx - 5, y + 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 12, y + 6);
        ctx.lineTo(cx + 5, y + 9);
        ctx.stroke();

        // Augen (klein, wütend)
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 10, y + 10, 4, 4);
        ctx.fillRect(cx + 6, y + 10, 4, 4);

        // Roter Glanz wenn wütend
        if (this.angry) {
            ctx.fillStyle = '#f44';
            ctx.fillRect(cx - 9, y + 11, 2, 2);
            ctx.fillRect(cx + 7, y + 11, 2, 2);
        }

        // Mund (grimmig, nach unten)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + 16, 5, 1.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();

        // --- Sprech-Blase ---
        if (this.quoteDisplay > 0 && this.currentQuote) {
            const lines = this.currentQuote.split('\n');
            const maxW = lines.reduce((m, l) => Math.max(m, l.length * 7), 0);
            const bw = maxW + 16;
            const bh = lines.length * 14 + 12;
            const bx = cx - bw / 2;
            const by = y - bh - 10;
            const alpha = Math.min(1, this.quoteDisplay);

            ctx.globalAlpha = alpha;
            // Dunkle Blase (grummelig!)
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 5);
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Pfeil
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.moveTo(cx - 4, by + bh);
            ctx.lineTo(cx, by + bh + 6);
            ctx.lineTo(cx + 4, by + bh);
            ctx.closePath();
            ctx.fill();
            // Text
            ctx.fillStyle = '#ff8888';
            ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], cx, by + 12 + i * 14);
            }
            ctx.textAlign = 'start';
        }

        ctx.globalAlpha = 1;

        // HP-Balken
        if (this.health < this.maxHealth && !this.isDying) {
            const barW = this.width;
            ctx.fillStyle = '#400';
            ctx.fillRect(x, y - 6, barW, 4);
            ctx.fillStyle = '#d33';
            ctx.fillRect(x, y - 6, barW * (this.health / this.maxHealth), 4);
        }
    }
}
