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
import { TornadoMount } from '../entities/mount.js';
import { CloudGrump } from '../enemies/cloud-grump.js';
import { JumpPad } from '../entities/jumppad.js';
import { Boss } from '../enemies/boss.js';
import { Dragon } from '../enemies/dragon.js';
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

        // Drache spawnen (statt Boss, in Level 7)
        this.dragon = null;
        if (level.dragon) {
            const dragon = new Dragon(level.dragon.x, level.dragon.y);
            const bDiff = diff.boss;
            dragon.health = Math.round(500 * bDiff.healthMult);
            dragon.maxHealth = Math.round(500 * bDiff.healthMult);
            dragon._damageMult = bDiff.damageMult;
            dragon.phase2Threshold = bDiff.phase2Threshold;
            dragon.phase3Threshold = bDiff.phase3Threshold;
            dragon.onDeath = () => {
                game.score += Math.round(2000 * (game._scoreMultiplier || 1));
            };
            this.dragon = dragon;
            game.addEntity(dragon);
        }

        // Auto-Mount im Flug-Level (Tornado bereits beritten)
        if (level.autoMount) {
            // Tornado wurde oben gespawnt — finde ihn und mounte sofort
            const mount = game.entities.find(e => e instanceof TornadoMount);
            if (mount) {
                mount.x = player.x - 2;
                mount.y = player.y + 30;
                mount.mounted = true;
                player._onMount = true;
            }
        }

        // Boss spawnen
        this.boss = null;
        this.princessSpawned = false;
        this.dragonCutscene = null;
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
            'Ein Drache hat Lea geschnappt!\nFinn springt auf den Tornado...\n...und nimmt die Verfolgung auf!',
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

        // Boss besiegt → Drachen-Zwischensequenz oder Prinzessin
        if (this.boss && this.boss.defeated && !this.princessSpawned) {
            this.princessSpawned = true;
            const px = this.boss.x + this.boss.width / 2 - 12;
            const py = this.boss.y;
            const level = LEVELS[game.currentLevel];

            if (level && level.dragonCutscene) {
                // Drachen-Cutscene starten
                this.startDragonCutscene(game, px, py);
            } else {
                // Echte Prinzessin (für andere Levels mit Boss aber ohne Cutscene)
                game.addEntity(new Princess(px, py));
                if (game.particles) {
                    game.particles.emit(px + 12, py + 22, 30, {
                        color: '#ffcc00', speed: 120, life: 0.8, size: 5
                    });
                    game.particles.showDamage(px + 12, py - 20, 'Lea!', '#e8c44a');
                }
            }
        }

        // Cutscene-Update
        if (this.dragonCutscene) {
            this.updateDragonCutscene(dt, game);
        }

        // Drache besiegt → Prinzessin gerettet → Victory
        if (this.dragon && this.dragon.defeated && !this.princessSpawned) {
            // Drache fällt — warte bis Tod-Animation vorbei
            if (!this.dragon.alive) {
                this.princessSpawned = true;
                // Prinzessin schwebt direkt am Spieler — wird sofort gerettet
                const px = (game.player.x || 400) + 30;
                const py = (game.player.y || 300) - 20;
                const princess = new Princess(px, py);
                // Princess hängt am Spieler (folgt mit)
                princess._followPlayer = true;
                game.addEntity(princess);
                if (game.particles) {
                    game.particles.emit(px + 12, py + 22, 40, {
                        color: '#ffcc00', speed: 200, life: 1.2, size: 6
                    });
                    game.particles.showDamage(px + 12, py - 30, 'LEA gerettet!', '#e8c44a');
                }
                if (game.screenFx) game.screenFx.flash('#ffcc00', 0.4);
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

    startDragonCutscene(game, px, py) {
        // Prinzessin spawnen — wird vom Drachen geschnappt
        const princess = new Princess(px, py);
        princess._captured = false;
        princess._inCutscene = true; // verhindert Auto-Rescue während Cutscene
        this._cutscenePrincess = princess;
        game.addEntity(princess);

        // Cutscene-Phasen
        this.dragonCutscene = {
            phase: 'princess-appears', // → wall-crack → dragon-emerges → grab → fly-up → tornado-arrive → fade
            timer: 0,
            // Drache-Position (knapp innerhalb des Levels, hinter der Wand)
            dragonX: game.tilemap ? game.tilemap.widthPx - 80 : 1520,
            dragonY: py - 20,
            dragonVx: 0,
            dragonVy: 0,
            wallCrackX: game.tilemap ? game.tilemap.widthPx - 30 : 1500,
            wallCrackY: py + 20,
            // Tornado-Position (kommt von oben)
            tornadoX: 0,
            tornadoY: -100,
            done: false,
        };

        // Spieler bewegungslos während Cutscene
        if (game.player) {
            game.player._cutsceneFreeze = true;
            game.player.vx = 0;
        }
    }

    updateDragonCutscene(dt, game) {
        const cs = this.dragonCutscene;
        if (!cs) return;
        cs.timer += dt;

        const princess = this._cutscenePrincess;

        if (cs.phase === 'princess-appears') {
            // Prinzessin steht da, Spieler sieht sie
            if (cs.timer >= 1.5) {
                cs.phase = 'wall-crack';
                cs.timer = 0;
                if (game.audio) game.audio.play('hit');
                if (game.screenFx) game.screenFx.shake(8, 0.4);
            }
        } else if (cs.phase === 'wall-crack') {
            // Wand bröckelt, Erschütterungen
            if (Math.random() < 0.3 && game.particles) {
                game.particles.emit(cs.wallCrackX, cs.wallCrackY + (Math.random() - 0.5) * 60, 4, {
                    color: '#888', speed: 80, life: 0.6, size: 3
                });
            }
            if (cs.timer >= 1.5) {
                cs.phase = 'dragon-emerges';
                cs.timer = 0;
                if (game.screenFx) game.screenFx.shake(15, 0.6);
                if (game.screenFx) game.screenFx.flash('#aa4422', 0.3);
                if (game.particles) {
                    // Großer Wand-Bruch-Effekt
                    game.particles.emit(cs.wallCrackX, cs.wallCrackY, 40, {
                        color: '#aaa', speed: 200, life: 0.8, size: 5
                    });
                }
            }
        } else if (cs.phase === 'dragon-emerges') {
            // Drache fliegt von rechts herein
            cs.dragonVx -= 80 * dt; // beschleunigt nach links
            cs.dragonX += cs.dragonVx * dt;
            // Hin zum Prinzessinnen-Y
            const targetY = princess ? princess.y - 30 : cs.dragonY;
            cs.dragonY += (targetY - cs.dragonY) * dt * 2;

            if (cs.dragonX <= (princess ? princess.x + 30 : cs.wallCrackX - 200)) {
                cs.phase = 'grab';
                cs.timer = 0;
            }
        } else if (cs.phase === 'grab') {
            // Drache schnappt Prinzessin
            if (princess && !princess._captured) {
                princess._captured = true;
                if (game.audio) game.audio.play('hurt');
                if (game.screenFx) game.screenFx.shake(10, 0.4);
                if (game.particles) {
                    game.particles.showDamage(princess.x + 12, princess.y - 30, 'NEEEIN!', '#ff44ff');
                }
            }
            // Prinzessin folgt Drache
            if (princess) {
                princess.x = cs.dragonX - 30;
                princess.y = cs.dragonY + 20;
                princess._heldByDragon = true;
            }
            // Drache schwebt kurz
            cs.dragonVx = 0;
            if (cs.timer >= 1.5) {
                cs.phase = 'fly-up';
                cs.timer = 0;
            }
        } else if (cs.phase === 'fly-up') {
            // Drache fliegt mit Prinzessin nach oben
            cs.dragonVy -= 200 * dt;
            cs.dragonVx -= 30 * dt;
            cs.dragonX += cs.dragonVx * dt;
            cs.dragonY += cs.dragonVy * dt;
            if (princess) {
                princess.x = cs.dragonX - 30;
                princess.y = cs.dragonY + 20;
            }
            // Tornado erscheint nach 1s
            if (cs.timer > 1) {
                if (cs.tornadoX === 0) {
                    cs.tornadoX = (game.player.x || 200) + 100;
                }
                cs.tornadoY += (game.player.y - 50 - cs.tornadoY) * dt * 2;
            }
            // Wenn Drache weit oben ist und Tornado da → next phase
            if (cs.timer >= 2.5) {
                cs.phase = 'tornado-arrive';
                cs.timer = 0;
            }
        } else if (cs.phase === 'tornado-arrive') {
            // Tornado positioniert sich neben Spieler
            cs.tornadoX += ((game.player.x + 60) - cs.tornadoX) * dt * 3;
            cs.tornadoY += ((game.player.y - 20) - cs.tornadoY) * dt * 3;
            // Drache weiter nach oben/außen
            cs.dragonY += cs.dragonVy * dt;
            cs.dragonX += cs.dragonVx * dt;
            if (princess) {
                princess.x = cs.dragonX - 30;
                princess.y = cs.dragonY + 20;
            }
            if (cs.timer >= 1.8) {
                cs.phase = 'fade';
                cs.timer = 0;
            }
        } else if (cs.phase === 'fade') {
            // Schwarzer Fade-Out, dann Level 7 laden
            if (cs.timer >= 1.0 && !cs.done) {
                cs.done = true;
                // Spieler-Status für nächstes Level merken
                this.savedElements = new Set(game.player.elements);
                this.savedActive = game.player.activeElement;
                game.player._cutsceneFreeze = false;
                // Prinzessin entfernen (wird im nächsten Level wieder gespawnt)
                if (princess) princess.alive = false;
                this._cutscenePrincess = null;
                this.dragonCutscene = null;
                // Level 7 laden via Transition
                this.startTransition(game, game.currentLevel + 1);
            }
        }
    }

    renderDragonCutscene(ctx, game) {
        const cs = this.dragonCutscene;
        if (!cs) return;

        // Wand-Riss visualisieren
        if (cs.phase === 'wall-crack' || cs.phase === 'dragon-emerges') {
            const cam = game.camera;
            const wx = cs.wallCrackX - cam.x;
            const wy = cs.wallCrackY - cam.y;
            const progress = cs.phase === 'wall-crack' ? Math.min(1, cs.timer / 1.5) : 1;
            ctx.save();
            ctx.strokeStyle = '#1a0a0a';
            ctx.lineWidth = 2 + progress * 3;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(wx, wy - 40 + i * 20);
                ctx.lineTo(wx - 20 - progress * 30, wy - 40 + i * 20 + (Math.random() - 0.5) * 10);
                ctx.lineTo(wx - 5 - progress * 20, wy - 30 + i * 20 + (Math.random() - 0.5) * 8);
                ctx.lineTo(wx - 30 - progress * 40, wy - 25 + i * 20);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Drache rendern (nur in Cutscene-Phasen)
        if (['dragon-emerges', 'grab', 'fly-up', 'tornado-arrive'].includes(cs.phase)) {
            this.renderCutsceneDragon(ctx, game, cs);
        }

        // Tornado rendern
        if (['fly-up', 'tornado-arrive'].includes(cs.phase) && cs.tornadoX > 0) {
            this.renderCutsceneTornado(ctx, game, cs);
        }

        // Fade-Out Overlay
        if (cs.phase === 'fade') {
            ctx.globalAlpha = Math.min(1, cs.timer / 1.0);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, game.width, game.height);
            ctx.globalAlpha = 1;
        }

        // Cutscene-Untertitel
        const subtitles = {
            'princess-appears': 'Lea ist befreit!',
            'wall-crack': '...etwas bricht durch die Wand!',
            'dragon-emerges': 'Ein DRACHE!',
            'grab': 'Er schnappt sich Lea!',
            'fly-up': 'Hinterher!',
            'tornado-arrive': 'Der Tornado kommt zur Hilfe!',
            'fade': '',
        };
        const text = subtitles[cs.phase];
        if (text) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, game.height - 80, game.width, 60);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(text, game.width / 2, game.height - 42);
            ctx.textAlign = 'start';
            ctx.restore();
        }
    }

    renderCutsceneDragon(ctx, game, cs) {
        const cam = game.camera;
        const dx = cs.dragonX - cam.x;
        const dy = cs.dragonY - cam.y;
        const t = (game.particles && game.particles.particles) ? performance.now() / 1000 : 0;
        const wing = Math.sin(t * 8) * 10;
        const w = 100, h = 70;

        ctx.save();
        // Drache spiegeln (kommt von rechts)
        if (cs.dragonVx <= 0) {
            ctx.translate(dx + w / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(dx + w / 2), 0);
        }

        // Schatten
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(dx + w / 2, dy + h + 20, 40, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hinterer Flügel
        ctx.fillStyle = '#5a1a1a';
        ctx.beginPath();
        ctx.moveTo(dx + w * 0.4, dy + h * 0.3);
        ctx.lineTo(dx + w * 0.2, dy - 20 + wing);
        ctx.lineTo(dx + w * 0.05, dy + wing);
        ctx.lineTo(dx + w * 0.15, dy + h * 0.4);
        ctx.closePath();
        ctx.fill();

        // Schwanz
        ctx.fillStyle = '#7a2a1a';
        ctx.beginPath();
        ctx.moveTo(dx + w * 0.05, dy + h * 0.5);
        ctx.lineTo(dx - 20, dy + h * 0.55);
        ctx.lineTo(dx - 30, dy + h * 0.5);
        ctx.lineTo(dx - 25, dy + h * 0.65);
        ctx.lineTo(dx + w * 0.1, dy + h * 0.7);
        ctx.closePath();
        ctx.fill();

        // Körper
        ctx.fillStyle = '#7a2a1a';
        ctx.beginPath();
        ctx.ellipse(dx + w / 2, dy + h * 0.55, w * 0.4, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bauch
        ctx.fillStyle = '#aa4a2a';
        ctx.beginPath();
        ctx.ellipse(dx + w / 2, dy + h * 0.6, w * 0.3, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vorderer Flügel
        ctx.fillStyle = '#5a1a1a';
        ctx.beginPath();
        ctx.moveTo(dx + w * 0.45, dy + h * 0.35);
        ctx.lineTo(dx + w * 0.3, dy - 30 - wing);
        ctx.lineTo(dx + w * 0.15, dy - 10 - wing);
        ctx.lineTo(dx + w * 0.25, dy + h * 0.45);
        ctx.closePath();
        ctx.fill();

        // Kopf
        ctx.fillStyle = '#aa3a1a';
        ctx.beginPath();
        ctx.arc(dx + w * 0.85, dy + h * 0.35, 18, 0, Math.PI * 2);
        ctx.fill();
        // Schnauze
        ctx.beginPath();
        ctx.ellipse(dx + w * 0.95, dy + h * 0.4, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hörner
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(dx + w * 0.78, dy + h * 0.25);
        ctx.lineTo(dx + w * 0.74, dy + h * 0.05);
        ctx.lineTo(dx + w * 0.84, dy + h * 0.18);
        ctx.closePath();
        ctx.fill();
        // Glühende Augen
        ctx.fillStyle = '#ff6622';
        ctx.beginPath();
        ctx.arc(dx + w * 0.88, dy + h * 0.32, 3, 0, Math.PI * 2);
        ctx.fill();
        // Zähne
        ctx.fillStyle = '#fff';
        ctx.fillRect(dx + w * 0.92, dy + h * 0.45, 1.5, 4);
        ctx.fillRect(dx + w * 0.96, dy + h * 0.45, 1.5, 4);

        // Krallen (halten Prinzessin in 'grab' und später)
        if (['grab', 'fly-up', 'tornado-arrive'].includes(cs.phase)) {
            ctx.fillStyle = '#222';
            ctx.fillRect(dx + w * 0.3, dy + h * 0.85, 20, 8);
            // "Klauen-Linien" zur Prinzessin
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(dx + w * 0.3, dy + h * 0.93);
            ctx.lineTo(dx + w * 0.28, dy + h * 1.02);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(dx + w * 0.4, dy + h * 0.93);
            ctx.lineTo(dx + w * 0.42, dy + h * 1.02);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderCutsceneTornado(ctx, game, cs) {
        const cam = game.camera;
        const tx = cs.tornadoX - cam.x;
        const ty = cs.tornadoY - cam.y;
        const spin = (performance.now() / 1000) * 8;

        // Wirbel-Ringe
        for (let i = 0; i < 6; i++) {
            const ry = ty + 24 - i * 6;
            const rx = tx + Math.sin(spin + i * 1.0) * (8 - i * 0.8);
            const r = 14 - i * 1.2;
            ctx.globalAlpha = 0.5 + i * 0.05;
            ctx.strokeStyle = i % 2 === 0 ? '#aaeeff' : '#88ccee';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(rx, ry, r, r * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Augen
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(tx - 4, ty - 6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 4, ty - 6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#224';
        ctx.beginPath(); ctx.arc(tx - 3, ty - 6, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 5, ty - 6, 1.5, 0, Math.PI * 2); ctx.fill();
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
        } else if (theme === 'storm') {
            skyGrad.addColorStop(0, '#0a0614');
            skyGrad.addColorStop(0.5, '#1a1828');
            skyGrad.addColorStop(1, '#2a2538');
        } else {
            skyGrad.addColorStop(0, '#1a1a3e');
            skyGrad.addColorStop(0.5, '#2a3a5e');
            skyGrad.addColorStop(1, '#4a6a5e');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Parallax
        if ((theme !== 'cave' && theme !== 'castle') || theme === 'storm') {
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

        // Drachen-HP-Balken
        if (this.dragon && !this.dragon.defeated) {
            this.dragon.renderBossBar(ctx, width);
        }

        // Drachen-Cutscene
        if (this.dragonCutscene) {
            this.renderDragonCutscene(ctx, game);
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
