# Bugs & Todos — Finn von Felixtanien

## Bekannte Bugs

### Hoch
- **Spike-Tiles machen keinen Schaden**: SPIKE(4) ist visuell gerendert (Level 3 Lava-Boden), aber der Player hat keinen Schadenscheck dafür. Spieler fällt durch Stacheln in die Tiefe statt Schaden zu nehmen. Fix: In `player.js` Tile-Check für SPIKE einbauen.

### Mittel
- **`ctx.roundRect()` Browser-Kompatibilität**: Sprechblasen in `mount.js` und `cloud-grump.js` nutzen `roundRect()`. In älteren Browsern (vor ~2023) nicht verfügbar. Fix: Fallback auf `fillRect` oder eigene Rounded-Rect-Funktion.
- **Boss-Minions haben kein Standard-Rendering**: Minions in `boss.js` werden als einfache Rechtecke gerendert (kein Blinking bei i-Frames, keine Animation). Fix: `OrcBasic`-Klasse wiederverwenden oder minimales Ork-Rendering einbauen.

### Niedrig
- **Player `_onMount` Hack**: `player._onMount` ist ein informelles Flag das vom Mount gesetzt wird. Wenn der Spieler auf dem Mount stirbt, wird es nicht zurückgesetzt. Fix: Formales `mounted`-Property im Player.

## Geplante Features

### Schattenwelt-Licht-Mechanik (Level 5)
**Idee**: Kein Licht am Start, nur winziger Sichtkreis (30px). Feuer-Element aktiv = mittlerer Sichtkreis (120px, Schwert als Fackel). Licht-Orb eingesammelt + aktiv = voller Sichtkreis (250px). Macht die Schattenwelt zu einem Such-Puzzle.

### Level-Übergänge
**Idee**: Kurze Story-Einblendungen zwischen Levels. 2-3 Sätze Typewriter-Effekt auf schwarzem Hintergrund. Gibt dem Spieler eine Verschnaufpause und erzählt die Reise.
Beispiele:
- Level 1→2: *"Finn verlässt den Wald und steigt hinab in die Tiefen Höhlen..."*
- Level 5→6: *"Vor Finn erhebt sich das dunkle Schloss Garnonstadt..."*
- Level 6→7: *"Das war eine Falle! Die echte Lea muss im Kerker sein!"*

### Weitere Level-Verbesserungen
- **Level 3**: Stacheln am Boden sollten Kontaktschaden machen (nicht Instant-Tod)
- **Level 4**: CloudGrumps könnten Regen-Effekt haben der Spieler verlangsamt
- **Level 6**: Mehr Plattformen im Boss-Bereich für taktischen Kampf

### Gameplay
- **Combo-System**: Mehrere schnelle Treffer hintereinander = Schadensbonus
- **Dash-Move**: Kurzer Ausweich-Sprint (Doppel-Tap A/D)
- **Boss-Intro-Cutscene**: Kamera zoomt auf Ganondorf, er sagt seinen ersten Spruch, dann beginnt der Kampf
- **Score-Tabelle**: Highscore nach Victory-Screen anzeigen (localStorage)

### Visuell
- **Bäume/Büsche** als Vordergrund-Dekorations-Entities in Level 1 (Wald-Feeling)
- **Schneeflocken/Regen** als Wetter-Partikel pro Level-Theme
- **Charakter-Portraits** in Sprechblasen für Story-Dialoge

### Audio
- **Hintergrundmusik**: Einfache Loop-Melodie pro Level-Theme (optional, Mute möglich)
- **Boss-Musik**: Intensivere Melodie, wechselt pro Phase
- **Victory-Fanfare**: Kurze Melodie beim Sieg
