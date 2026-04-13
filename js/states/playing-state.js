import { GameState } from './state.js';
import { Player } from '../player.js';
import { TileMap } from '../tilemap.js';
import { LEVELS } from '../levels/level-data.js';
import { spawnEnemiesForLevel } from '../enemies/orc-spawner.js';
import { ElementOrb } from '../items/element-orb.js';
import { HealthPotion } from '../items/health-potion.js';
import { Door } from '../entities/door.js';
import { Sign } from '../entities/sign.js';
import { Princess } from '../entities/princess.js';
import { FakePrincess } from '../entities/fake-princess.js';
import { TornadoMount } from '../entities/mount.js';
import { CloudGrump } from '../enemies/cloud-grump.js';
import { JumpPad } from '../entities/jumppad.js';
import { Boss } from '../enemies/boss.js';
import { ElementHUD } from '../ui/element-hud.js';
import { getDifficulty } from '../difficulty.js';

export class PlayingState extends GameState {
    constructor() {
        super();
        this.elementHUD = new ElementHUD();
        this.levelNameTimer = 0;
        this.levelName = '';
        this.savedElements = null;
        this.savedActive = null;
        this.boss = null;
        this.princessSpawned = false;

        // Level-Übergang
        this.transition = null; // { phase, timer, text, nextLevel, elements, active, score }
    }

    enter(game) {
        this.savedElements = null;
        this.savedActive = null;
        this.transition = null;
        this.loadLevel(game, 0);
    }

    loadLevel(game, index) {
        if (index >= LEVELS.length) {
            game.setState('victory');
            return;
        }

        // Elemente vom vorherigen Level retten
        const prevElements = this.savedElements || (game.player ? new Set(game.player.elements) : new Set());
        const prevActive = this.savedActive || (game.player ? game.player.activeElement : null);
        const prevScore = game.score || 0;

        game.currentLevel = index;
        const level = LEVELS[index];

        game.tilemap = new TileMap(level.tiles);
        game.camera.setLevelBounds(game.tilemap.widthPx, game.tilemap.heightPx);
        game.levelStart = { ...level.playerStart };

        game.entities = [];
        game.particles.particles = [];
        game.particles.floatingTexts = [];

        // Spieler erstellen
        const player = new Player(level.playerStart.x, level.playerStart.y);
        // Schwierigkeitsgrad anwenden
        const diff = getDifficulty(game);
        player.maxHealth = diff.player.maxHealth;
        player.health = diff.player.maxHealth;
        player.attackPower = diff.player.attackPower;
        player.invincibleDuration = diff.player.invincibleDuration;
        player._fallDamageMult = diff.fallDamageMult;
        player._fallSafe = diff.fallSafe;
        game._scoreMultiplier = diff.scoreMultiplier;
        // Elemente wiederherstellen (außer beim allerersten Level)
        if (index > 0) {
            player.elements = prevElements;
            player.activeElement = prevActive;
        }
        game.player = player;
        game.score = index > 0 ? prevScore : 0;
        game.addEntity(player);

        // Kamera sofort zum Spieler snappen (kein Lerp vom alten Level)
        game.camera.snapTo(player);

        // Feinde spawnen
        spawnEnemiesForLevel(game, level);

        // Items spawnen
        for (const def of level.items) {
            if (def.type === 'element-orb') {
                game.addEntity(new ElementOrb(def.x, def.y, def.element));
            } else if (def.type === 'health-potion') {
                const potion = new HealthPotion(def.x, def.y);
                potion.healAmount = Math.round(potion.healAmount * diff.potionHealMult);
                game.addEntity(potion);
            }
        }

        // Schilder spawnen
        for (const def of (level.signs || [])) {
            game.addEntity(new Sign(def.x, def.y, def.text));
        }

        // Tür spawnen
        if (level.door) {
            game.addEntity(new Door(level.door.x, level.door.y));
        }

        // Reittier spawnen
        if (level.mount) {
            game.addEntity(new TornadoMount(level.mount.x, level.mount.y));
        }

        // Sprungpads spawnen
        for (const def of (level.jumppads || [])) {
            game.addEntity(new JumpPad(def.x, def.y));
        }

        // Fliegende Wolken-Gegner spawnen
        for (const def of (level.clouds || [])) {
            const cloud = new CloudGrump(def.x, def.y);
            if (def.flyRange) cloud.flyRange = def.flyRange;
            cloud.flyOrigin = def.x;
            cloud.baseY = def.y;
            // Schwierigkeitsgrad auf Wolken anwenden
            cloud.health = Math.round(cloud.health * diff.enemy.healthMult);
            cloud.maxHealth = Math.round(cloud.maxHealth * diff.enemy.healthMult);
            cloud.damage = Math.round(cloud.damage * diff.enemy.damageMult);
            cloud.onDeath = () => { game.score += Math.round(75 * (game._scoreMultiplier || 1)); };
            game.addEntity(cloud);
        }

        // Boss spawnen
        this.boss = null;
        this.princessSpawned = false;
        if (level.boss) {
            const boss = new Boss(level.boss.x, level.boss.y);
            // Schwierigkeitsgrad auf Boss anwenden
            const bDiff = diff.boss;
            boss.health = Math.round(400 * bDiff.healthMult);
            boss.maxHealth = Math.round(400 * bDiff.healthMult);
            boss.damage = Math.round(boss.damage * bDiff.damageMult);
            boss.phase2Threshold = bDiff.phase2Threshold;
            boss.phase3Threshold = bDiff.phase3Threshold;
            boss.summonInterval = Math.round(boss.summonInterval * bDiff.summonIntervalMult);
            boss._damageMult = bDiff.damageMult;
            boss._minionHealthMult = bDiff.minionHealthMult;
            boss.onDeath = () => {
                game.score += Math.round(1000 * (game._scoreMultiplier || 1));
                if (game.particles) {
                    game.particles.emit(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, {
                        color: '#ff4', speed: 200, life: 1, size: 6
                    });
                }
            };
            this.boss = boss;
            game.addEntity(boss);
        }

        // Level-Name einblenden
        this.levelNameTimer = 2.5;
        this.levelName = level.name;
    }

    // Story-Texte zwischen Levels
    getTransitionText(fromLevel) {
        const texts = [
            'Der Wald liegt hinter Finn.\nVor ihm öffnet sich der Eingang\nzu den Tiefen Höhlen...',
            'Die Höhlen werden heißer.\nEin roter Schein leuchtet\naus der Tiefe...',
            'Finn entkommt dem Feuer.\nÜber ihm erstrecken sich\ndie Windklippen...',
            'Hoch über den Wolken\nführt der Weg hinab\nin die Dunkelheit...',
            'Durch den Schatten hindurch\nerhebt sich das Schloss\nvon Garnonstadt!',
            'Das war eine Falle!\nDie echte Lea muss\nim Kerker sein!',
        ];
        return texts[fromLevel] || '';
    }

    startTransition(game, nextLevel) {
        this.transition = {
            phase: 'fadeout',  // fadeout → text → fadein
            timer: 0,
            text: this.getTransitionText(game.currentLevel),
            nextLevel,
            elements: game.player ? new Set(game.player.elements) : new Set(),
            activeElement: game.player ? game.player.activeElement : null,
            score: game.score,
            typewriterPos: 0,
        };
    }

    update(dt, game) {
        if (this.levelNameTimer > 0) this.levelNameTimer -= dt;

        // --- Level-Übergang ---
        if (this.transition) {
            this.transition.timer += dt;
            const t = this.transition;

            if (t.phase === 'fadeout' && t.timer >= 0.8) {
                // Fade-out fertig → Level laden + Text zeigen
                t.phase = 'text';
                t.timer = 0;
                t.typewriterPos = 0;
                this.loadLevel(game, t.nextLevel);
                game.score = t.score;
                if (game.player) {
                    game.player.elements = t.elements;
                    game.player.activeElement = t.activeElement;
                }
            } else if (t.phase === 'text') {
                // Typewriter-Effekt
                t.typewriterPos += dt * 30;
                // Nach 3s oder Enter → Fade-in
                if (t.timer >= 3 || game.input.justPressed('Enter') || game.input.justPressed('Space')) {
                    t.phase = 'fadein';
                    t.timer = 0;
                }
            } else if (t.phase === 'fadein' && t.timer >= 0.8) {
                this.transition = null;
            }
            return; // Kein normales Update während Übergang
        }

        // Pending Level-Wechsel (von Door ausgelöst) → Transition starten
        if (game._pendingLevelChange) {
            const pending = game._pendingLevelChange;
            game._pendingLevelChange = null;
            this.startTransition(game, pending.level);
            return;
        }

        // Pause
        if (game.input.justPressed('Escape')) {
            game.setState('pause');
            return;
        }

        // Elemente fürs Speichern merken
        if (game.player) {
            this.savedElements = new Set(game.player.elements);
            this.savedActive = game.player.activeElement;
        }

        // Entities updaten
        for (const entity of game.entities) {
            entity.update(dt, game);
        }
        game.entities = game.entities.filter(e => e.alive !== false);

        // Partikel
        game.particles.update(dt);

        // Kamera
        if (game.player) {
            game.camera.follow(game.player);
        }

        // Boss besiegt → Prinzessin spawnen (echt oder fake!)
        if (this.boss && this.boss.defeated && !this.princessSpawned) {
            this.princessSpawned = true;
            const px = this.boss.x + this.boss.width / 2 - 12;
            const py = this.boss.y;
            const level = LEVELS[game.currentLevel];

            if (level && level.fakePrincess) {
                // PLOTTWIST! Falsche Prinzessin!
                game.addEntity(new FakePrincess(px, py));
                if (game.particles) {
                    game.particles.showDamage(px + 12, py - 20, 'Lea...?', '#e8c44a');
                }
            } else {
                // Echte Prinzessin
                game.addEntity(new Princess(px, py));
                if (game.particles) {
                    game.particles.emit(px + 12, py + 22, 30, {
                        color: '#ffcc00', speed: 120, life: 0.8, size: 5
                    });
                    game.particles.showDamage(px + 12, py - 20, 'Lea!', '#e8c44a');
                }
            }
        }

        // Bonus-Level: echte Prinzessin wenn alle Feinde besiegt
        const level = LEVELS[game.currentLevel];
        if (level && level.realPrincess && !this.princessSpawned) {
            const enemiesAlive = game.entities.some(e => e.takeDamage && e !== game.player && e.health > 0);
            if (!enemiesAlive) {
                this.princessSpawned = true;
                // Echte Lea im Kerker befreit!
                const px = level.tiles[0].length * 32 - 100;
                const py = level.tiles.length * 32 - 96;
                game.addEntity(new Princess(px, py));
                if (game.particles) {
                    game.particles.emit(px + 12, py + 22, 30, {
                        color: '#ffcc00', speed: 150, life: 1, size: 5
                    });
                    game.particles.showDamage(px + 12, py - 20, 'Die ECHTE Lea!', '#e8c44a');
                }
                if (game.screenFx) game.screenFx.flash('#ffcc00', 0.3);
            }
        }

        // Game Over Check
        if (game.player && game.player.health <= 0) {
            game.setState('gameover');
        }

        // UI
        game.scoreEl.textContent = `Score: ${game.score}`;
        game.fpsEl.textContent = `${game.currentFps} FPS`;
    }

    render(ctx, game) {
        const { width, height, camera } = game;
        const level = LEVELS[game.currentLevel];
        const theme = level ? level.theme : 'forest';

        // Himmel (themenabhängig)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (theme === 'cave' || theme === 'dark') {
            skyGrad.addColorStop(0, '#0a0a14');
            skyGrad.addColorStop(1, '#1a1a24');
        } else if (theme === 'lava') {
            skyGrad.addColorStop(0, '#1a0a0a');
            skyGrad.addColorStop(0.7, '#2a1a0a');
            skyGrad.addColorStop(1, '#4a2a0a');
        } else if (theme === 'sky') {
            skyGrad.addColorStop(0, '#2a4a8e');
            skyGrad.addColorStop(0.5, '#4a7ace');
            skyGrad.addColorStop(1, '#aaccee');
        } else if (theme === 'castle') {
            skyGrad.addColorStop(0, '#0a0a1e');
            skyGrad.addColorStop(1, '#1a1a2e');
        } else {
            skyGrad.addColorStop(0, '#1a1a3e');
            skyGrad.addColorStop(0.5, '#2a3a5e');
            skyGrad.addColorStop(1, '#4a6a5e');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Parallax
        if (theme !== 'cave' && theme !== 'castle') {
            game.renderBackground(ctx, theme);
        }

        // Dunkelheits-Vignette für Schattenpfad
        if (theme === 'dark' && game.player) {
            // Wird nach Entities gerendert
        }

        // Kamera-Transform
        camera.apply(ctx);

        if (game.tilemap) game.tilemap.render(ctx, camera);

        for (const entity of game.entities) {
            entity.render(ctx);
        }

        game.particles.render(ctx);

        camera.reset(ctx);

        // Dunkelheits-Overlay für Schattenpfad
        if (theme === 'dark' && game.player) {
            this.renderDarkOverlay(ctx, game);
        }

        // HUD
        game.renderHUD(ctx);
        this.elementHUD.render(ctx, game.player, width);

        // Boss-HP-Balken
        if (this.boss && !this.boss.defeated) {
            this.boss.renderBossBar(ctx, width);
        }

        // Level-Name Einblendung
        if (this.levelNameTimer > 0 && !this.transition) {
            const alpha = this.levelNameTimer > 1.5
                ? Math.min(1, (2.5 - this.levelNameTimer) * 2)
                : this.levelNameTimer / 1.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, height / 2 - 30, width, 60);
            ctx.fillStyle = '#e8c44a';
            ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.levelName, width / 2, height / 2 + 8);
            ctx.textAlign = 'start';
            ctx.globalAlpha = 1;
        }

        // --- Level-Übergangs-Overlay ---
        if (this.transition) {
            this.renderTransition(ctx, width, height);
        }
    }

    renderTransition(ctx, w, h) {
        const t = this.transition;

        if (t.phase === 'fadeout') {
            // Schwarzes Overlay faded ein
            ctx.globalAlpha = Math.min(1, t.timer / 0.8);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        } else if (t.phase === 'text') {
            // Schwarzer Hintergrund + Typewriter-Text
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);

            // Sterne im Hintergrund
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 30; i++) {
                const sx = (i * 137 + 50) % w;
                const sy = (i * 89 + 30) % h;
                ctx.fillRect(sx, sy, 1, 1);
            }
            ctx.globalAlpha = 1;

            // Text mit Typewriter-Effekt
            const lines = t.text.split('\n');
            const fullText = t.text.replace(/\n/g, '');
            const visibleChars = Math.floor(t.typewriterPos);

            ctx.font = '20px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';

            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                let visibleLine = '';
                for (let c = 0; c < line.length; c++) {
                    if (charCount < visibleChars) {
                        visibleLine += line[c];
                    }
                    charCount++;
                }
                ctx.fillStyle = '#c8b878';
                ctx.fillText(visibleLine, w / 2, h / 2 - 30 + i * 30);
            }

            // "Weiter" Hinweis
            if (t.timer > 1.5) {
                const blink = Math.sin(t.timer * 4) > 0;
                if (blink) {
                    ctx.fillStyle = '#666';
                    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
                    ctx.fillText('Drücke ENTER', w / 2, h / 2 + 80);
                }
            }
            ctx.textAlign = 'start';
        } else if (t.phase === 'fadein') {
            // Schwarzes Overlay faded aus
            ctx.globalAlpha = 1 - Math.min(1, t.timer / 0.8);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    renderDarkOverlay(ctx, game) {
        // Radial-Gradient um Spieler: sichtbar in der Mitte, dunkel am Rand
        const px = game.player.x + game.player.width / 2 - game.camera.x;
        const py = game.player.y + game.player.height / 2 - game.camera.y;
        const grad = ctx.createRadialGradient(px, py, 60, px, py, 250);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, game.width, game.height);
    }
}
