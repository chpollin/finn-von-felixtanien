# Architektur — Finn von Felixtanien

## Technologie
- **Sprache**: Vanilla JavaScript (ES Modules, kein Bundler)
- **Rendering**: HTML5 Canvas 2D (800x600 interne Auflösung)
- **Audio**: Web Audio API (programmatisch generierte Retro-Sounds)
- **Hosting**: GitHub Pages (statisch, kein Backend)
- **Lokal**: `npx serve .` → http://localhost:3000

## Dateistruktur

```
index.html                     — Einstiegspunkt
css/style.css                  — Dark-Theme Styles
js/
├── main.js                    — Entry Point, erstellt Game und startet
├── game.js                    — Game-Klasse: State-Manager, Loop, Audio, ScreenFx
├── input.js                   — Tastatur & Maus (isKeyDown, justPressed, endFrame)
├── entity.js                  — Basis-Klasse: Position, AABB, takeDamage, i-Frames
├── player.js                  — Finn: Bewegung, Nahkampf, Fernattacke, Elemente, Mount
├── physics.js                 — Konstanten (GRAVITY, FRICTION), applyGravity()
├── camera.js                  — Kamera: Lerp-Smoothing, snapTo(), Viewport-Bounds
├── tilemap.js                 — TileMap: Grid, Rendering (Viewport-Culling), Kollision
├── combat.js                  — Hitbox-Berechnung, Knockback, Schadensfunktionen
├── effects.js                 — ParticleSystem: Partikel, schwebende Schadenszahlen
├── elements.js                — 6 Elemente, Schwäche-Matrix, getEffectiveness()
├── projectile.js              — 6 Fernattacken: Fireball, Wave, Vine, Tornado, Curse, LightBeam
├── audio.js                   — AudioManager: Web Audio API, programmatische Retro-Sounds
├── states/
│   ├── state.js               — Abstrakte GameState-Basisklasse
│   ├── title-state.js         — Titelbildschirm mit Schloss-Silhouette
│   ├── playing-state.js       — Haupt-State: Level laden, Entity-Spawning, HUD, Dark-Overlay
│   ├── pause-state.js         — Pause-Menü (Weiter/Neustart/Hauptmenü)
│   ├── gameover-state.js      — Game Over mit Fade + Neustart-Option
│   └── victory-state.js       — Sieg-Bildschirm (Finn + Lea Silhouette)
├── enemies/
│   ├── enemy.js               — Enemy-Basis: KI State-Machine (PATROL→CHASE→ATTACK→HURT→DEAD)
│   ├── orc-basic.js           — Standard-Ork (grün, Schweinekopf, Holzkeule)
│   ├── orc-fire.js            — Feuer-Ork (orange, schnell, Flammen)
│   ├── orc-water.js           — Wasser-Ork (blau, langsam, viel HP)
│   ├── orc-earth.js           — Erd-Ork (braun, massiv, Steinrüstung)
│   ├── orc-air.js             — Luft-Ork (hellblau, sehr schnell, schwebt)
│   ├── orc-dark.js            — Dunkelheits-Ork (lila, periodisch unsichtbar)
│   ├── orc-light.js           — Licht-Ork (gelb, leuchtend)
│   ├── orc-spawner.js         — Factory: spawnt Orks aus Level-Daten
│   ├── boss.js                — Ganondorf: 3 Phasen, wächst, Sprüche, Slam, Minion-Spawning
│   └── cloud-grump.js         — Grummelige Gewitterwolke (fliegt, Blitze, meckert)
├── items/
│   ├── item.js                — Basis-Item (schwebt, sammelbar)
│   ├── element-orb.js         — Element-Kugel (pulsierend, gibt Element)
│   └── health-potion.js       — Heiltrank (+30 HP)
├── entities/
│   ├── door.js                — Level-Ausgang (Portal, Element-Transfer zum nächsten Level)
│   ├── sign.js                — Schild (zeigt Text-Bubble bei Nähe)
│   ├── princess.js            — Echte Prinzessin Lea (Victory-Trigger, dt-basierter Timer)
│   ├── fake-princess.js       — Falsche Prinzessin (Plottwist: verkleideter Ork)
│   ├── mount.js               — Tornado-Reittier (fliegbar, lustige Sprüche)
│   └── jumppad.js             — Sprungpad (schleudert Spieler hoch)
├── levels/
│   └── level-data.js          — 7 Level-Definitionen (Tiles, Feinde, Items, Doors, Mounts)
└── ui/
    ├── element-hud.js         — Element-Anzeige unten (Kugeln 1-6, aktives hervorgehoben)
    └── screen-effects.js      — Screen-Shake, Flash, Vignette bei niedrigem HP

knowledge/                     — Projekt-Dokumentation
├── architecture.md            — Dieses Dokument
├── game.md                    — Spieldesign (Story, Charaktere, Mechaniken)
├── levels.md                  — Level-Details (Tiles, Feinde, Layout, Besonderheiten)
├── changelog.md               — Chronologische Änderungshistorie
└── bugs-and-todos.md          — Bekannte Bugs und geplante Features
```

## Kern-Architektur

### Game-Loop
```
Game.loop(timestamp)
├── dt = delta time (capped bei 50ms)
├── Mute-Toggle (M-Taste)
├── screenFx.update(dt)
├── ctx.save() + screenFx.applyShake()
├── currentState.update(dt, game)     ← State-Pattern
├── currentState.render(ctx, game)
├── ctx.restore()
├── screenFx.renderFlash()
├── screenFx.renderVignette()         ← bei HP < 30%
└── input.endFrame()                  ← für justPressed()
```

### State-Manager
`Game.states` = Map von GameState-Instanzen. `setState(name)` ruft `exit()` → `enter()` auf.
- `'playing-resume'` = Spezialfall: zurück zum Playing-State ohne Level-Reset (für Pause)
- Playing-State enthält: Level-Laden, Entity-Spawning, Update/Render-Delegation, HUD

### Entity-System (Vererbung, kein ECS)
```
Entity (Position, AABB, takeDamage, i-Frames, alive)
├── Player (Bewegung, Kampf, Elemente, Fernattacke, _onMount)
├── Enemy (KI State-Machine, HP, patrolOrigin/Range)
│   ├── OrcBasic, OrcFire, OrcWater, OrcEarth, OrcAir, OrcDark, OrcLight
│   └── Boss (3 Phasen, wächst, Slam, Minions, Sprüche)
├── CloudGrump (Fliegende Wolke, eigenständige KI, Blitze)
├── Projectile (Basis: fliegt, trifft Gegner, Lifetime)
│   ├── Fireball, Wave, Vine, Tornado, Curse
│   └── LightBeam (vertikale Säule, Vorwarnung)
├── Item → ElementOrb, HealthPotion
├── Door (Level-Wechsel, Element-Transfer)
├── Sign, Princess, FakePrincess (Plottwist)
├── TornadoMount (Reittier, Sprüche)
└── JumpPad (Katapult)
```
Alle Entities in `game.entities[]`. Tote (`alive === false`) werden automatisch entfernt.

### Tile-System
- `TileMap.resolveCollision(entity)`: Erst horizontal, dann vertikal (verhindert Corner-Glitches)
- Solid: GROUND(1), STONE(2), PLATFORM(3), GRASS_TOP(5)
- SPIKE(4): Definiert, visuell als Stacheln/Lava gerendert
- Viewport-Culling: Nur sichtbare Tiles werden gezeichnet

### Kamera
- `follow(target)`: Lerp-Smoothing (0.08) + Level-Bounds-Clamping
- `snapTo(target)`: Sofort-Positionierung (beim Level-Wechsel, verhindert Lerp von alter Position)

### Element-System
Kreislauf: Feuer→Erde→Luft→Wasser→Feuer, Dunkelheit↔Helligkeit.
Effektiv = 2x, Schwach = 0.5x. Beeinflusst: Schwertfarbe, Nahkampf-Multiplikator, Fernattacke.

### Fernattacken
| Element | Klasse | Verhalten |
|---------|--------|-----------|
| Feuer | Fireball | Horizontal, 30 Schaden |
| Wasser | Wave | Breite Welle, Push (kein Schaden) |
| Erde | Vine | Verwurzelt (Stun 2s) + Dornen-DoT (dt-basiert) |
| Luft | Tornado | Schleudert Gegner hoch |
| Dunkelheit | Curse | Verflucht: 2x Schaden für 4s (dt-basiert) |
| Helligkeit | LightBeam | Lichtsäule von oben, 35 Schaden |

### Boss-Phasen (Ganondorf)
| Phase | HP | Größe | Speed | Schaden | Besonderheit |
|-------|-----|-------|-------|---------|-------------|
| 1 | 100-50% | 48x64 | 80 | 25 | Sprungattacke alle 4s |
| 2 | 50-25% | 56x72 | 110 | 30 | + Minion-Spawning alle 8s, Screen-Shake |
| 3 | 25-0% | 64x80 | 140 | 35 | + Boden-Slam, 3 Minions, Element-Wechsel, rote Aura |

### Plottwist-Flow
```
Level 6: Boss besiegt → FakePrincess spawnt → Berühren → Reveal (Ork!) → Flee → Level 7
Level 7: Alle Feinde besiegen → Echte Princess spawnt → Berühren → Victory
```
