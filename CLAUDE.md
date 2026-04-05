# Browser Game

## Überblick
Lokales Browser-Game — läuft komplett im Browser ohne Server/Build-Tools.

## Projekt-Struktur
```
index.html          — Einstiegspunkt, direkt im Browser öffnen
css/style.css       — Styles
js/main.js          — Entry-Modul (importiert Game)
js/game.js          — Game-Loop, Update/Render-Zyklus
js/input.js         — Tastatur- & Maus-Input
js/entity.js        — Basis-Klasse für Spielobjekte
```

## Starten
`index.html` im Browser öffnen. Wegen ES-Modulen wird ein lokaler Server benötigt:
```bash
npx serve .
```
Dann http://localhost:3000 öffnen.

## Architektur
- **Game-Loop**: `requestAnimationFrame` mit Delta-Time in Sekunden
- **Entity-System**: Objekte erben von `Entity` und überschreiben `update(dt, game)` / `render(ctx)`
- **Input**: `game.input.isKeyDown('ArrowLeft')` / `game.input.mouse`
- **Kollision**: `entity.collidesWith(other)` — AABB

## Konventionen
- Reines Vanilla JS (ES-Module), kein Framework
- Canvas 800×600 interne Auflösung
- Deutsche Kommentare, englische Code-Bezeichner
