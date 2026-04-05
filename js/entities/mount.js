import { Entity } from '../entity.js';

const QUOTES = [
    'Festhalten, Finn!',
    'Wuuuuusch!',
    'Ich bin der schnellste\nTornado der Welt!',
    'Höher! HÖHER!',
    'Hihi, das kitzelt!',
    'Orks? Pffft, weg\nmit denen!',
    'Mein Bauch grummelt...\ndas war der Wind!',
    'Flieg mit mir,\nich hab Kuchen dabei!',
    'Ups, fast einen Vogel\nverschluckt!',
    'Ich dreh mich...\nmir wird gar nicht\nschwindelig. DIR schon?',
    'Links, rechts,\noben — mir egal!',
    'BRRRRRR!',
    'Nenn mich Wirbel-Werner!',
    'Weißt du was Wolken\nschmecken? Watte!',
    'Ich war mal eine\nleichte Brise...\ndann kam die Pubertät!',
    'Hey Finn, guck mal\nkeine Hände! ...oh wait.',
    'Rauf auf meinen\nRücken! Ähm...\nich HAB keinen Rücken.',
    'La la laaa~\n♪ Tornado-Song! ♪',
    'Achtung, Turbulenzen!\nHaha, nur Spaß!',
    'Ich pupse Wind.\nAlso... quasi immer.',
];

export class TornadoMount extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 28;
        this.height = 40;
        this.timer = 0;

        // Reittier-Status
        this.mounted = false;
        this.flySpeed = 200;

        // Sprüche
        this.quoteTimer = 0;
        this.quoteInterval = 5;
        this.currentQuote = '';
        this.quoteDisplay = 0;
        this.usedQuotes = [];

        // Animation
        this.spinSpeed = 0;
        this.idleBob = 0;

        // Augen-Blink
        this.blinkTimer = 0;
        this.blinking = false;
    }

    getRandomQuote() {
        if (this.usedQuotes.length >= QUOTES.length) this.usedQuotes = [];
        const available = QUOTES.filter((_, i) => !this.usedQuotes.includes(i));
        const idx = QUOTES.indexOf(available[Math.floor(Math.random() * available.length)]);
        this.usedQuotes.push(idx);
        return QUOTES[idx];
    }

    update(dt, game) {
        this.timer += dt;

        // Blink
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.blinking = !this.blinking;
            this.blinkTimer = this.blinking ? 0.15 : 2 + Math.random() * 3;
        }

        // Sprüche-Timer
        this.quoteTimer += dt;
        if (this.quoteDisplay > 0) this.quoteDisplay -= dt;

        if (this.quoteTimer >= this.quoteInterval) {
            this.quoteTimer = 0;
            this.quoteInterval = 4 + Math.random() * 4;
            this.currentQuote = this.getRandomQuote();
            this.quoteDisplay = 3;
        }

        if (!this.mounted) {
            // Warte auf Spieler
            this.idleBob += dt * 3;
            this.y += Math.sin(this.idleBob) * 0.5;
            this.spinSpeed = 4;

            // Spieler nah → aufsteigen (Space/W)
            if (game.player) {
                const dx = Math.abs(this.x - game.player.x);
                const dy = Math.abs(this.y - game.player.y);
                if (dx < 40 && dy < 50) {
                    if (game.input.justPressed('ArrowUp') || game.input.justPressed('KeyW') || game.input.justPressed('Space')) {
                        this.mount(game);
                    }
                }
            }
        } else {
            // Reiten — Spieler steuert den Tornado
            const input = game.input;
            let mx = 0, my = 0;
            if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) mx = -1;
            if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) mx = 1;
            if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW') || input.isKeyDown('Space')) my = -1;
            if (input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS')) my = 1;

            this.x += mx * this.flySpeed * dt;
            this.y += my * this.flySpeed * dt;

            // Level-Grenzen
            if (game.tilemap) {
                this.x = Math.max(0, Math.min(game.tilemap.widthPx - this.width, this.x));
                this.y = Math.max(0, Math.min(game.tilemap.heightPx - this.height, this.y));
            }

            // Tile-Kollision: nicht in Wände fliegen
            if (game.tilemap) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                if (game.tilemap.isSolidAtWorld(cx, cy)) {
                    this.y -= 4;
                }
            }

            // Spieler folgt dem Tornado
            game.player.x = this.x - 2;
            game.player.y = this.y - 30;
            game.player.vy = 0;
            game.player.vx = 0;
            game.player.grounded = false;

            this.spinSpeed = 8 + (Math.abs(mx) + Math.abs(my)) * 4;

            // Absteigen (J oder Shift)
            if (game.input.justPressed('ShiftLeft') || game.input.justPressed('ShiftRight')) {
                this.dismount(game);
            }

            // Wind-Partikel beim Fliegen
            if ((mx !== 0 || my !== 0) && game.particles && Math.random() > 0.6) {
                game.particles.emit(this.x + this.width / 2, this.y + this.height, 1, {
                    color: '#aaeeff', speed: 40, life: 0.3, size: 2
                });
            }
        }
    }

    mount(game) {
        this.mounted = true;
        game.player._onMount = true;
        this.currentQuote = 'Festhalten, Finn!';
        this.quoteDisplay = 2.5;
        this.quoteTimer = 0;
        if (game.audio) game.audio.play('pickup');
        if (game.particles) {
            game.particles.emit(this.x + this.width / 2, this.y + this.height / 2, 15, {
                color: '#aaeeff', speed: 100, life: 0.5, size: 3
            });
        }
    }

    dismount(game) {
        this.mounted = false;
        game.player._onMount = false;
        game.player.vy = -200;
        this.currentQuote = 'Bis baaald!';
        this.quoteDisplay = 2;
        if (game.audio) game.audio.play('jump');
    }

    render(ctx) {
        const cx = Math.round(this.x + this.width / 2);
        const cy = Math.round(this.y + this.height / 2);
        const spin = this.timer * this.spinSpeed;

        // --- Tornado-Körper ---
        // Wirbel-Ringe (von unten nach oben, kleiner werdend)
        for (let i = 0; i < 7; i++) {
            const ry = cy + 18 - i * 6;
            const rx = cx + Math.sin(spin + i * 1.0) * (8 - i * 0.8);
            const r = 14 - i * 1.2;

            ctx.globalAlpha = 0.5 + i * 0.05;
            ctx.strokeStyle = i % 2 === 0 ? '#aaeeff' : '#88ccee';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(rx, ry, r, r * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // --- Gesicht ---
        const faceY = cy - 10;

        // Augen
        if (this.blinking) {
            // Zugekniffene Augen (Striche)
            ctx.strokeStyle = '#225588';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - 7, faceY); ctx.lineTo(cx - 2, faceY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2, faceY); ctx.lineTo(cx + 7, faceY); ctx.stroke();
        } else {
            // Große freche Augen
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 5, faceY, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 5, faceY, 4, 0, Math.PI * 2); ctx.fill();
            // Pupillen (schauen in Flugrichtung)
            ctx.fillStyle = '#224';
            ctx.beginPath(); ctx.arc(cx - 4, faceY, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 6, faceY, 2, 0, Math.PI * 2); ctx.fill();
        }

        // Breites Grinsen
        ctx.strokeStyle = '#225588';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, faceY + 5, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Zunge bei bestimmten Sprüchen
        if (this.quoteDisplay > 0) {
            ctx.fillStyle = '#ff6688';
            ctx.beginPath();
            ctx.ellipse(cx + 2, faceY + 10, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // --- "Steig auf!" Hinweis wenn nicht beritten ---
        if (!this.mounted) {
            const bob = Math.sin(this.timer * 3) * 3;
            ctx.fillStyle = '#aaeeff';
            ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('↑ Aufsteigen', cx, this.y - 12 + bob);
            ctx.textAlign = 'start';
        }

        // --- Sprech-Blase ---
        if (this.quoteDisplay > 0 && this.currentQuote) {
            const lines = this.currentQuote.split('\n');
            const maxW = lines.reduce((m, l) => Math.max(m, l.length * 7.5), 0);
            const bw = maxW + 20;
            const bh = lines.length * 15 + 14;
            const bx = cx - bw / 2;
            const by = this.y - bh - 22;
            const alpha = Math.min(1, this.quoteDisplay);

            ctx.globalAlpha = alpha;

            // Blase
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 6);
            ctx.fill();
            ctx.strokeStyle = '#88ccee';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Pfeil
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx - 5, by + bh);
            ctx.lineTo(cx, by + bh + 8);
            ctx.lineTo(cx + 5, by + bh);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#88ccee';
            ctx.beginPath();
            ctx.moveTo(cx - 5, by + bh);
            ctx.lineTo(cx, by + bh + 8);
            ctx.lineTo(cx + 5, by + bh);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#335';
            ctx.font = '11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], cx, by + 14 + i * 15);
            }
            ctx.textAlign = 'start';

            ctx.globalAlpha = 1;
        }
    }
}
