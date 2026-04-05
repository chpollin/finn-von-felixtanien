# Architektur — Finn von Felixtanien

## Technologie
- **Sprache**: Vanilla JavaScript (ES Modules, kein Bundler)
- **Rendering**: HTML5 Canvas 2D (800x600 interne Auflösung)
- **Audio**: Web Audio API (programmatisch generierte Retro-Sounds)
- **Server**: `npx serve .` — reiner Static-File-Server, keine Backend-Logik

## Dateistruktur

```
index.html                 — Einstiegspunkt
css/style.css              — Dark-Theme Styles
js/
├── main.js                — Entry Point, erstellt Game-Instanz und startet
├── game.js                — Zentrale Game-Klasse, State-Manager, Loop
├── input.js               — Tastatur & Maus Input (isKeyDown, justPressed)
├── entity.js              — Basis-Klasse für alle Spielobjekte
├── player.js              — Spieler "Finn" (Bewegung, Kampf, Elemente, Rendering)
├── physics.js             — Physik-Konstanten (GRAVITY, FRICTION), Hilfsfunktionen
├── camera.js              — Kamera mit Lerp-Smoothing, Viewport-Grenzen
├── tilemap.js             — Tile-basierte Level-Map, Rendering, Kollisionserkennung
├── combat.js              — Kampf-Hilfsfunktionen (Hitbox, Knockback, Schaden)
├── effects.js             — Partikel-System (ParticleSystem, Particle, schwebende Texte)
├── elements.js            — 6-Element-System, Schwäche-Matrix, Farben
├── projectile.js          — Fernattacken (Fireball, Wave, Vine, Tornado, Curse, LightBeam)
├── audio.js               — AudioManager (Web Audio API, programmatische Sounds)
├── states/
│   ├── state.js           — Abstrakte GameState-Basisklasse
│   ├── title-state.js     — Titelbildschirm
│   ├── playing-state.js   — Hauptspiel-State (Level-Laden, Update, Render)
│   ├── pause-state.js     — Pause-Menü
│   ├── gameover-state.js  — Game Over Screen
│   └── victory-state.js   — Sieg-Bildschirm
├── enemies/
│   ├── enemy.js           — Enemy-Basisklasse (KI State-Machine: PATROL→CHASE→ATTACK)
│   ├── orc-basic.js       — Standard-Ork (Schweinemensch, grün)
│   ├── orc-fire.js        — Feuer-Ork (orange, schnell)
│   ├── orc-water.js       — Wasser-Ork (blau, viel HP)
│   ├── orc-earth.js       — Erd-Ork (braun, massiv, Steinrüstung)
│   ├── orc-air.js         — Luft-Ork (hellblau, sehr schnell, schwebt)
│   ├── orc-dark.js        — Dunkelheits-Ork (lila, wird periodisch unsichtbar)
│   ├── orc-light.js       — Licht-Ork (gelb, leuchtet)
│   ├── orc-spawner.js     — Factory: spawnt Feinde aus Level-Daten
│   └── boss.js            — Boss "Ganondorf" (3 Phasen, spawnt Minions)
├── items/
│   ├── item.js            — Basis-Item-Klasse (schwebt, sammelbar)
│   ├── element-orb.js     — Element-Kugel (gibt Spieler ein Element)
│   └── health-potion.js   — Heiltrank (+30 HP)
├── entities/
│   ├── door.js            — Level-Ausgang (Portal, lädt nächstes Level)
│   ├── sign.js            — Tutorial-Schild (zeigt Text bei Nähe)
│   └── princess.js        — Prinzessin Lea (erscheint nach Boss-Sieg)
├── levels/
│   └── level-data.js      — 6 Level-Definitionen (Tiles, Feinde, Items, Doors)
└── ui/
    ├── element-hud.js     — Element-Anzeige am unteren Bildschirmrand
    └── screen-effects.js  — Screen-Shake, Flash, Vignette

knowledge/
├── architecture.md        — Dieses Dokument
└── game.md                — Spieldesign-Dokument
```

## Kern-Architektur

### Game-Loop
```
Game.loop(timestamp)
├── dt = delta time (capped bei 50ms)
├── screenFx.update(dt)
├── currentState.update(dt, game)    ← State-Pattern
├── currentState.render(ctx, game)   ← mit Shake-Transform
├── screenFx.renderFlash / renderVignette
└── input.endFrame()                 ← für justPressed()
```

### State-Manager
`Game` hält eine Map von `GameState`-Instanzen. `setState(name)` ruft `exit()` auf dem alten und `enter()` auf dem neuen State auf. Spezialfall: `'playing-resume'` springt zurück zum Playing-State ohne Level-Reset.

### Entity-System
Vererbungshierarchie (kein ECS):
```
Entity (Basis: Position, AABB-Kollision, takeDamage, i-Frames)
├── Player (Bewegung, Kampf, Elemente, Fernattacke)
├── Enemy (KI State-Machine, HP)
│   ├── OrcBasic, OrcFire, OrcWater, OrcEarth, OrcAir, OrcDark, OrcLight
│   └── Boss (3 Phasen, Minion-Spawning)
├── Projectile (Fernattacke-Basis)
│   ├── Fireball, Wave, Vine, Tornado, Curse
│   └── LightBeam (Sonderfall: vertikale Säule)
├── Item → ElementOrb, HealthPotion
├── Door, Sign, Princess
```

Alle Entities werden in `game.entities[]` verwaltet. `update(dt, game)` und `render(ctx)` werden jeden Frame aufgerufen. Tote Entities (`alive === false`) werden automatisch entfernt.

### Tile-Kollision
`TileMap.resolveCollision(entity)` prüft erst horizontale, dann vertikale Kollision. Das verhindert "Corner-Glitches". Solid-Tiles: GROUND, STONE, PLATFORM, GRASS_TOP. Spikes (TILE=4) sind Boden der tötet (via Fallgruben-Check im Player).

### Kamera
`Camera.follow(target)` nutzt Lerp-Smoothing (`this.x += (targetX - this.x) * 0.08`) mit Level-Bounds-Clamping. `apply(ctx)` / `reset(ctx)` wrappen `ctx.save/translate/restore`.

### Element-System
6 Elemente in einem Schwäche-Kreislauf:
- Feuer → Erde → Luft → Wasser → Feuer
- Dunkelheit ↔ Helligkeit
- Effektiv = 2x Schaden, Schwach = 0.5x

Spieler sammelt Elemente als Orbs ein. Aktives Element beeinflusst:
1. Schwertfarbe + Glow
2. Nahkampf-Schadensmultiplikator
3. Fernattacke (K-Taste) — jedes Element hat einen eigenen Projektil-Typ

### Fernattacken (Projektile)
| Element | Klasse | Verhalten |
|---------|--------|-----------|
| Feuer | Fireball | Fliegt horizontal, 30 Schaden |
| Wasser | Wave | Breite Welle, schiebt Gegner zurück, 0 Schaden |
| Erde | Vine | Verwurzelt Gegner (Stun 2s) + Dornen-DoT |
| Luft | Tornado | Wirbel, schleudert Gegner hoch |
| Dunkelheit | Curse | Verflucht Gegner → nimmt 2x Schaden für 4s |
| Helligkeit | LightBeam | Lichtsäule von oben, Vorwarnung, 35 Schaden |
