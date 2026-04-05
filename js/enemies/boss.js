import { Enemy, STATE } from './enemy.js';

const BOSS_QUOTES = {
    1: [
        'Du wagst es,\nmein Schloss\nzu betreten?!',
        'Ich bin GANONDORF!\nKönig von\nGarnonstadt!',
        'Dein Schwertchen\nmacht mir\nkeine Angst!',
        'Felixtanien\nwird FALLEN!',
    ],
    2: [
        'GENUG!\nJetzt wird es\nERNST!',
        'ORKS!\nZERSTÖRT IHN!',
        'Du bist\nhartnäckig...\nABER ICH AUCH!',
        'MEINE MACHT\nWÄCHST!',
        'Spürst du\ndie DUNKELHEIT?!',
    ],
    3: [
        'RAAAAHHHH!!',
        'ICH BIN\nUNAUFHALTSAM!!!',
        'ALLES WIRD\nBRENNEN!!',
        'DU WIRST\nNIEMALS\nGEWINNEN!!!',
        'ABSOLUTE\nVERNICHTUNG!',
        'ICH WERDE\nDICH\nZERMALMEN!!',
    ],
};

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 48;
        this.height = 64;

        this.health = 400;
        this.maxHealth = 400;
        this.damage = 25;
        this.speed = 50;
        this.chaseSpeed = 80;
        this.sightRange = 500;
        this.attackRange = 50;
        this.attackCooldownMax = 1.5;
        this.invincibleDuration = 0.3;

        this.element = null;
        this.phase = 1;
        this.prevPhase = 1;
        this.animTimer = 0;
        this.jumpTimer = 0;
        this.jumpInterval = 4;
        this.summonTimer = 0;
        this.summonInterval = 8;
        this.glowTimer = 0;
        this.defeated = false;

        // Sprüche
        this.quoteTimer = 2;
        this.currentQuote = '';
        this.quoteDisplay = 0;
        this.usedQuotes = [];

        // Phase 3 Spezial
        this.slamCooldown = 0;
        this.slamActive = false;
        this.slamTimer = 0;

        // Größen-Scaling pro Phase
        this.baseWidth = 48;
        this.baseHeight = 64;
    }

    getQuote() {
        const pool = BOSS_QUOTES[this.phase] || BOSS_QUOTES[1];
        if (this.usedQuotes.length >= pool.length) this.usedQuotes = [];
        const avail = pool.filter((_, i) => !this.usedQuotes.includes(i));
        const pick = avail[Math.floor(Math.random() * avail.length)];
        this.usedQuotes.push(pool.indexOf(pick));
        return pick;
    }

    update(dt, game) {
        if (this.defeated) return;
        super.update(dt, game);
        this.animTimer += dt * 4;
        this.glowTimer += dt;

        // Sprüche
        this.quoteTimer -= dt;
        if (this.quoteDisplay > 0) this.quoteDisplay -= dt;
        if (this.quoteTimer <= 0) {
            this.quoteTimer = 4 + Math.random() * 3;
            this.currentQuote = this.getQuote();
            this.quoteDisplay = 2.5;
        }

        // --- Phasen-Wechsel ---
        const hpRatio = this.health / this.maxHealth;

        if (hpRatio <= 0.25 && this.phase < 3) {
            this.phase = 3;
            this.onPhaseChange(3, game);
        } else if (hpRatio <= 0.5 && this.phase < 2) {
            this.phase = 2;
            this.onPhaseChange(2, game);
        }

        // Sprungattacke
        if (this.aiState === STATE.CHASE) {
            this.jumpTimer += dt;
            const jumpInt = this.phase === 3 ? 2 : this.phase === 2 ? 3 : this.jumpInterval;
            if (this.jumpTimer >= jumpInt && this.grounded) {
                const force = this.phase === 3 ? -600 : this.phase === 2 ? -520 : -450;
                this.vy = force;
                this.grounded = false;
                this.jumpTimer = 0;
                if (game.particles) {
                    game.particles.emit(this.x + this.width / 2, this.y + this.height, 15, {
                        color: this.phase === 3 ? '#ff2200' : '#a55', speed: 100, life: 0.4, size: 4
                    });
                }
                if (game.audio) game.audio.play('jump');
            }
        }

        // Phase 2+: Orks beschwören
        if (this.phase >= 2) {
            this.summonTimer += dt;
            const sumInt = this.phase === 3 ? 5 : this.summonInterval;
            if (this.summonTimer >= sumInt) {
                this.summonTimer = 0;
                this.currentQuote = this.phase === 3 ? 'MEHR ORKS!!' : 'ORKS! Zu mir!';
                this.quoteDisplay = 1.5;
                this.spawnMinion(game, this.x - 50, this.y + 20);
                this.spawnMinion(game, this.x + this.width + 20, this.y + 20);
                if (this.phase === 3) {
                    this.spawnMinion(game, this.x, this.y - 30);
                }
                if (game.particles) {
                    game.particles.emit(this.x + this.width / 2, this.y, 20, {
                        color: '#a4a', speed: 150, life: 0.6, size: 4
                    });
                }
            }
        }

        // Phase 3: Boden-Slam
        if (this.phase === 3) {
            this.slamCooldown -= dt;
            if (this.slamCooldown <= 0 && this.grounded && game.player) {
                const dist = Math.abs(game.player.x - this.x);
                if (dist < 150) {
                    this.slamCooldown = 3;
                    this.slamActive = true;
                    this.slamTimer = 0.4;
                    if (game.screenFx) game.screenFx.shake(10, 0.3);
                    if (game.audio) game.audio.play('hit');
                    this.currentQuote = 'BEBEN!!';
                    this.quoteDisplay = 1;
                }
            }
            if (this.slamActive) {
                this.slamTimer -= dt;
                // Schockwelle trifft Spieler in der Nähe
                if (game.player && !game.player.invincible) {
                    const dist = Math.abs(game.player.x - (this.x + this.width / 2));
                    if (dist < 100 && game.player.grounded) {
                        game.player.takeDamage(20);
                        game.player.vy = -300;
                        game.player.grounded = false;
                    }
                }
                if (this.slamTimer <= 0) this.slamActive = false;
            }

            // Element wechselt periodisch
            if (Math.floor(this.glowTimer * 2) % 10 === 0 && Math.random() < dt * 2) {
                const elems = ['fire', 'water', 'earth', 'dark', 'light', 'air'];
                this.element = elems[Math.floor(Math.random() * elems.length)];
            }
        }
    }

    onPhaseChange(newPhase, game) {
        this.usedQuotes = [];
        this.prevPhase = newPhase;

        if (newPhase === 2) {
            this.chaseSpeed = 110;
            this.damage = 30;
            this.attackCooldownMax = 1.0;
            // Größer werden
            this.width = 56;
            this.height = 72;
            this.currentQuote = 'GENUG!\nJetzt wird es\nERNST!';
        } else if (newPhase === 3) {
            this.chaseSpeed = 140;
            this.damage = 35;
            this.attackCooldownMax = 0.7;
            // Noch größer
            this.width = 64;
            this.height = 80;
            this.currentQuote = 'RAAAAHHHH!!\nMEINE WAHRE\nGESTALT!!';
        }

        this.quoteDisplay = 3;
        if (game.screenFx) game.screenFx.shake(12, 0.6);
        if (game.screenFx) game.screenFx.flash(newPhase === 3 ? '#ff0000' : '#ff8800', 0.3);
        if (game.particles) {
            game.particles.emit(this.x + this.width / 2, this.y + this.height / 2, 40, {
                color: newPhase === 3 ? '#ff2200' : '#ff8800',
                speed: 200, life: 0.8, size: 6
            });
        }
    }

    spawnMinion(game, x, y) {
        const minion = new Enemy(x, y);
        minion.width = 22;
        minion.height = 30;
        minion.health = 25;
        minion.maxHealth = 25;
        minion.damage = 8;
        minion.speed = 70;
        minion.chaseSpeed = 120;
        minion.sightRange = 300;
        minion.patrolOrigin = x;
        minion.patrolRange = 100;
        minion.aiState = STATE.CHASE;

        const origRender = minion.render.bind(minion);
        minion.render = (ctx) => {
            if (minion.aiState === STATE.DEAD) {
                ctx.globalAlpha = 1 - (minion.deathTimer / minion.deathDuration);
            }
            ctx.fillStyle = '#6a4a3a';
            ctx.fillRect(minion.x, minion.y + 8, 22, 22);
            ctx.fillStyle = '#d4967a';
            ctx.fillRect(minion.x + 3, minion.y, 16, 12);
            ctx.fillStyle = '#cc2200';
            ctx.fillRect(minion.x + 5, minion.y + 3, 3, 3);
            ctx.fillRect(minion.x + 14, minion.y + 3, 3, 3);
            minion.renderHealthBar(ctx);
            ctx.globalAlpha = 1;
        };
        minion.onDeath = () => { game.score += 25; };
        game.addEntity(minion);
    }

    takeDamage(amount, element = null) {
        if (this.defeated) return 0;
        const dmg = super.takeDamage(amount, element);
        if (this.health <= 0 && !this.defeated) {
            this.defeated = true;
            this.aiState = STATE.DEAD;
            this.currentQuote = 'NEEEIIIN!\nDas kann\nnicht sein...!';
            this.quoteDisplay = 2;
        }
        return dmg;
    }

    render(ctx) {
        if (this.defeated && this.deathTimer >= this.deathDuration) return;
        if (this.aiState === STATE.DEAD) {
            ctx.globalAlpha = Math.max(0, 1 - (this.deathTimer / this.deathDuration));
        }
        if (this.invincible && this.aiState !== STATE.DEAD) {
            if (Math.floor(this.invincibleTimer * 12) % 2 === 0) ctx.globalAlpha = 0.3;
        }

        ctx.save();
        const cx = this.x + this.width / 2;
        if (!this.facingRight) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const w = this.width;
        const h = this.height;
        const scale = w / this.baseWidth; // Skalierung basierend auf aktueller Größe

        // Phase 3 Wut-Aura
        if (this.phase === 3) {
            const pulse = Math.sin(this.glowTimer * 6) * 5;
            ctx.fillStyle = 'rgba(255, 30, 0, 0.25)';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w * 0.7 + pulse, 0, Math.PI * 2);
            ctx.fill();
            // Flammen-Partikel am Körper
            ctx.fillStyle = '#ff4400';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 4; i++) {
                const fx = x + Math.sin(this.animTimer + i * 2) * w * 0.4 + w / 2;
                const fy = y + Math.cos(this.animTimer * 1.5 + i) * 10 + 10;
                ctx.fillRect(fx - 3, fy - 3, 6, 6);
            }
            ctx.globalAlpha = 1;
        } else if (this.phase === 2) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.12)';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beine
        const legColor = this.phase === 3 ? '#1a0a0a' : this.phase === 2 ? '#222' : '#2a2a2a';
        ctx.fillStyle = legColor;
        ctx.fillRect(x + w * 0.12, y + h * 0.68, w * 0.25, h * 0.28);
        ctx.fillRect(x + w * 0.62, y + h * 0.68, w * 0.25, h * 0.28);

        // Stiefel
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x + w * 0.08, y + h * 0.9, w * 0.3, h * 0.1);
        ctx.fillRect(x + w * 0.58, y + h * 0.9, w * 0.33, h * 0.1);

        // Rüstung / Körper
        const armorColor = this.phase === 3 ? '#2a0a0a' : this.phase === 2 ? '#2a2a3a' : '#3a3a4a';
        ctx.fillStyle = armorColor;
        ctx.fillRect(x + w * 0.08, y + h * 0.31, w * 0.83, h * 0.4);

        // Rüstungs-Details
        const detailColor = this.phase === 3 ? '#4a1a1a' : '#4a4a5a';
        ctx.fillStyle = detailColor;
        ctx.fillRect(x + w * 0.16, y + h * 0.34, w * 0.67, h * 0.06);
        ctx.fillRect(x + w * 0.16, y + h * 0.53, w * 0.67, h * 0.06);

        // Gürtel
        ctx.fillStyle = this.phase === 3 ? '#aa2200' : '#8a6a20';
        ctx.fillRect(x + w * 0.08, y + h * 0.65, w * 0.83, h * 0.06);

        // Umhang
        const capeColor = this.phase === 3 ? '#3a0000' : this.phase === 2 ? '#3a1020' : '#4a1a2a';
        ctx.fillStyle = capeColor;
        ctx.fillRect(x, y + h * 0.31, w * 0.12, h * 0.6);
        ctx.fillRect(x + w * 0.88, y + h * 0.31, w * 0.12, h * 0.6);

        // Kopf
        const headColor = this.phase === 3 ? '#5a6a3a' : '#7a8a5a';
        ctx.fillStyle = headColor;
        ctx.fillRect(x + w * 0.16, y, w * 0.67, h * 0.34);

        // Ohren
        const earColor = this.phase === 3 ? '#4a5a2a' : '#6a7a4a';
        ctx.fillStyle = earColor;
        ctx.beginPath(); ctx.moveTo(x + w * 0.16, y + h * 0.09); ctx.lineTo(x + w * 0.04, y - h * 0.09); ctx.lineTo(x + w * 0.25, y + h * 0.05); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w * 0.83, y + h * 0.09); ctx.lineTo(x + w * 0.96, y - h * 0.09); ctx.lineTo(x + w * 0.75, y + h * 0.05); ctx.closePath(); ctx.fill();

        // Schnauze
        ctx.fillStyle = this.phase === 3 ? '#6a7a4a' : '#8a9a6a';
        ctx.fillRect(x + w * 0.29, y + h * 0.16, w * 0.42, h * 0.16);
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(x + w * 0.38, y + h * 0.2, w * 0.08, h * 0.06);
        ctx.fillRect(x + w * 0.58, y + h * 0.2, w * 0.08, h * 0.06);

        // Augen
        const eyeColor = this.phase === 3 ? '#ff0000' : this.phase === 2 ? '#ff4400' : '#cc3300';
        ctx.fillStyle = eyeColor;
        const eyeSize = w * 0.12;
        ctx.fillRect(x + w * 0.25, y + h * 0.08, eyeSize, eyeSize * 0.8);
        ctx.fillRect(x + w * 0.63, y + h * 0.08, eyeSize, eyeSize * 0.8);
        // Pupillen
        ctx.fillStyle = this.phase === 3 ? '#ff0' : '#440000';
        ctx.fillRect(x + w * 0.29, y + h * 0.09, eyeSize * 0.5, eyeSize * 0.5);
        ctx.fillRect(x + w * 0.67, y + h * 0.09, eyeSize * 0.5, eyeSize * 0.5);

        // Krone (wird wilder pro Phase)
        const crownColor = this.phase === 3 ? '#aa1100' : '#d4a017';
        ctx.fillStyle = crownColor;
        ctx.fillRect(x + w * 0.2, y - h * 0.09, w * 0.58, h * 0.09);
        const spikes = this.phase === 3 ? 5 : 3;
        for (let i = 0; i < spikes; i++) {
            const sx = x + w * 0.24 + i * (w * 0.52 / (spikes - 1));
            const spikeH = this.phase === 3 ? h * 0.14 : h * 0.09;
            ctx.fillRect(sx - 2, y - h * 0.09 - spikeH, 5 * scale, spikeH);
        }
        // Edelsteine
        ctx.fillStyle = this.phase === 3 ? '#ff0' : '#cc2244';
        for (let i = 0; i < Math.min(spikes, 3); i++) {
            const sx = x + w * 0.27 + i * (w * 0.46 / 2);
            ctx.fillRect(sx, y - h * 0.06, 3 * scale, 3 * scale);
        }

        // Hauer (größer pro Phase)
        ctx.fillStyle = '#ffe';
        const hauerH = this.phase === 3 ? h * 0.12 : this.phase === 2 ? h * 0.08 : h * 0.06;
        ctx.fillRect(x + w * 0.33, y + h * 0.28, 3 * scale, hauerH);
        ctx.fillRect(x + w * 0.63, y + h * 0.28, 3 * scale, hauerH);

        // Schwert (wird größer und wilder)
        const swordLen = this.phase === 3 ? h * 0.6 : this.phase === 2 ? h * 0.5 : h * 0.44;
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(x + w * 0.92, y + h * 0.28, 5 * scale, h * 0.22);
        ctx.fillStyle = this.phase === 3 ? '#cc2200' : '#888';
        ctx.fillRect(x + w * 0.92, y + h * 0.28 - swordLen, 5 * scale, swordLen);
        ctx.fillStyle = this.phase === 3 ? '#ff4400' : '#aaa';
        ctx.fillRect(x + w * 0.92, y + h * 0.28 - swordLen, 2 * scale, swordLen);
        // Schwert-Spitze
        ctx.beginPath();
        ctx.moveTo(x + w * 0.92, y + h * 0.28 - swordLen);
        ctx.lineTo(x + w * 0.92 + 5 * scale, y + h * 0.28 - swordLen);
        ctx.lineTo(x + w * 0.92 + 2.5 * scale, y + h * 0.28 - swordLen - 10 * scale);
        ctx.closePath();
        ctx.fill();
        // Handschutz
        ctx.fillStyle = this.phase === 3 ? '#aa2200' : '#8a6a20';
        ctx.fillRect(x + w * 0.85, y + h * 0.25, 11 * scale, 3 * scale);

        // Slam-Effekt (Phase 3)
        if (this.slamActive) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
            ctx.fillRect(x - 60, y + h - 8, w + 120, 16);
            ctx.fillStyle = 'rgba(255, 50, 0, 0.6)';
            for (let i = 0; i < 6; i++) {
                const sx = x - 50 + i * 30 + Math.sin(this.animTimer + i) * 5;
                ctx.fillRect(sx, y + h - 20, 4, 20);
            }
        }

        ctx.restore();

        // Sprech-Blase
        if (this.quoteDisplay > 0 && this.currentQuote) {
            const lines = this.currentQuote.split('\n');
            const maxW = lines.reduce((m, l) => Math.max(m, l.length * 8), 0);
            const bw = maxW + 20;
            const bh = lines.length * 16 + 14;
            const bx = x + w / 2 - bw / 2;
            const by = y - bh - 20;
            const alpha = Math.min(1, this.quoteDisplay);

            ctx.globalAlpha = alpha;
            const bgColor = this.phase === 3 ? '#2a0000' : this.phase === 2 ? '#2a1a00' : '#1a1a2a';
            ctx.fillStyle = bgColor;
            ctx.fillRect(bx, by, bw, bh);
            const borderColor = this.phase === 3 ? '#ff2200' : this.phase === 2 ? '#ff8800' : '#888';
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);

            const textColor = this.phase === 3 ? '#ff4444' : this.phase === 2 ? '#ffaa44' : '#cccccc';
            ctx.fillStyle = textColor;
            ctx.font = `bold ${this.phase === 3 ? 13 : 12}px "Segoe UI", system-ui, sans-serif`;
            ctx.textAlign = 'center';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], x + w / 2, by + 16 + i * 16);
            }
            ctx.textAlign = 'start';
            ctx.globalAlpha = 1;
        }

        ctx.globalAlpha = 1;
    }

    renderBossBar(ctx, screenWidth) {
        if (this.defeated) return;
        const barW = 300;
        const barH = 14;
        const bx = (screenWidth - barW) / 2;
        const by = 10;

        // Name + Phase
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const phaseText = this.phase === 3 ? ' [WUTMODUS]' : this.phase === 2 ? ' [ERWACHT]' : '';
        ctx.fillText(`Ganondorf${phaseText}`, screenWidth / 2, by + barH + 20);

        // Balken
        ctx.fillStyle = '#400';
        ctx.fillRect(bx, by, barW, barH);
        const ratio = this.health / this.maxHealth;
        const color = this.phase === 3 ? '#ff2200' : this.phase === 2 ? '#ff8800' : '#dd4444';
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, barW * ratio, barH);

        // Phasen-Markierungen
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + barW * 0.5, by); ctx.lineTo(bx + barW * 0.5, by + barH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + barW * 0.25, by); ctx.lineTo(bx + barW * 0.25, by + barH); ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, barH);

        ctx.textAlign = 'start';
    }
}
