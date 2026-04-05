# Level-Design — Finn von Felixtanien

## Gemeinsame Regeln
- **Tile-Größe**: 32x32 Pixel
- **Standard-Map**: 50 Spalten × 19 Reihen = 1600×608 Pixel
- **Boden-Y berechnen**: Reihe × 32 (z.B. Reihe 17 = y:544)
- **Spieler-Start-Y**: Boden-Y − Spieler-Höhe(48) − Puffer(4)
- **Enemy-Start-Y**: Boden-Y − Enemy-Höhe(~40) − Puffer
- **Elemente bleiben** über Level-Wechsel erhalten, Score wird kumuliert
- **Kamera snapt** beim Level-Wechsel sofort zum Spieler (kein Lerp)

## Level-Übersicht

| # | Name | Theme | Boden-Reihe | Spalten | Besonderheit |
|---|------|-------|-------------|---------|-------------|
| 1 | Der Wald von Felixtanien | forest | 17 | 50 | Durchkämpf-Level, kein Platforming |
| 2 | Die Tiefen Höhlen | cave | 12 | 50 | Geschlossene Höhle, Decke + Wände |
| 3 | Der Flammende Fluss | lava | 13 | 50 | Stacheln am Boden, Plattform-Sprünge |
| 4 | Die Windklippen | sky | 17 | 50 | Vertikales Level, Tornado-Mount, CloudGrumps |
| 5 | Der Schattenpfad | dark | 17 | 50 | Dunkelheits-Overlay, eingeschränkte Sicht |
| 6 | Schloss Garnonstadt | castle | 17 | 50 | Boss Ganondorf, Sprungpads, FakePrincess |
| 7 | Der Kerker | dark | 14 | 40 | Bonus-Level, 16 Reihen, echte Princess |

---

## Level 1: Der Wald von Felixtanien
- **Theme**: forest — Himmel-Gradient blau/grün, Parallax-Hügel
- **Layout**: Flacher durchgehender Gras-Boden (Reihe 17-18), keine Plattformen, keine Gruben
- **Feinde**: 7 Orks (5× Basic, 1× Erde, 1× Feuer), gleichmäßig verteilt
- **Items**: Feuer-Orb (x:200), 2 Heiltränke
- **Door**: Rechter Rand (x:1504)
- **Design-Intention**: Einstiegslevel. Spieler lernt Kampf durch Praxis, nicht durch Schilder.

## Level 2: Die Tiefen Höhlen
- **Theme**: cave — Sehr dunkel, Stein-Decke (Reihe 0) + Wände (Spalte 0, 49)
- **Layout**: 14 Reihen hoch. Boden bei Reihe 12-13 mit 2-Tile-Lücken. Breite Plattform-Abschnitte (13, 7, 7, 7, 7 Tiles). Obere Plattformen (Reihe 7-10) als Alternativroute.
- **Feinde**: 2× Basic-Ork, 2× Erd-Ork (alle bei y:340)
- **Items**: Wasser-Orb, 1 Heiltrank
- **Door**: x:1456
- **Design-Intention**: Plattform-Einführung in sicherem Umfeld (keine Instant-Death-Gruben)

## Level 3: Der Flammende Fluss
- **Theme**: lava — Rötlicher Himmel-Gradient, Stacheln am Boden (Reihe 14)
- **Layout**: 15 Reihen. Breite Stein-Plattformen (Reihe 13) mit 2-Tile-Lücken. Trittbretter (Reihe 12) über Lücken. Obere Plattformen (Reihe 7-8) als Alternativroute.
- **Feinde**: 3× Feuer-Ork, 1× Basic (alle bei y:370)
- **Items**: Erde-Orb, 2 Heiltränke
- **Door**: x:1504
- **Design-Intention**: Erste echte Herausforderung. Stacheln = Lava, Fehler kosten HP. Erde-Orb als Belohnung fürs Plattforming.

## Level 4: Die Windklippen
- **Theme**: sky — Blauer Himmel-Gradient, Wolken-Feeling
- **Layout**: Vertikales Level. Boden nur links (Reihe 17, 10 Tiles breit). Aufsteigende 3-Tile-Plattformen von links-unten (Reihe 11) nach rechts-oben (Reihe 2). Door ganz oben rechts.
- **Feinde**: 1× Luft-Ork (oben), 4× CloudGrumps (fliegende Gewitterwolken)
- **Items**: Luft-Orb (x:700, y:160), 1 Heiltrank
- **Besonderheiten**:
  - **Tornado-Mount** bei x:200 (Reittier zum Fliegen!)
  - **Schild** erklärt Steuerung (↑ Aufsteigen, Shift Absteigen)
  - CloudGrumps schießen Blitze und meckern
- **Door**: x:1472, y:16 (ganz oben rechts)
- **Design-Intention**: Belohnungs-Level. Der Tornado macht Spaß, CloudGrumps als komischer Kontrast.

## Level 5: Der Schattenpfad
- **Theme**: dark — Fast schwarzer Hintergrund, Stein-Decke (Reihe 0) + Wände
- **Layout**: 19 Reihen. Breiter Start-Boden (12 Tiles, Reihe 17-18) mit 2-Tile-Lücken. Trittbretter (Reihe 13). Obere Plattformen (Reihe 9-11).
- **Feinde**: 4× Dunkelheits-Ork, 1× Licht-Ork (alle bei y:496)
- **Items**: Licht-Orb, 2 Heiltränke
- **Besonderheit**: **Dunkelheits-Overlay** (radial-gradient um Spieler, Rest fast schwarz)
- **Door**: x:1488 (rechts unten, Kammer mit Stein-Wänden)
- **Design-Intention**: Atmosphäre und Spannung. Die eingeschränkte Sicht macht bekannte Mechaniken wieder frisch.

## Level 6: Schloss Garnonstadt
- **Theme**: castle — Dunkler Stein-Innenraum, Decke + Wände, kein Parallax
- **Layout**: 19 Reihen, komplett umschlossen. Durchgehender Boden (Reihe 17-18). Plattformen in Reihe 11 (4 Tiles breit, 3 Gruppen links).
- **Feinde**: 1× Basic, 1× Feuer, 1× Dunkel, 1× Erde (links), **Boss Ganondorf** (rechts, x:1200)
- **Items**: Dunkelheit-Orb, 2 Heiltränke, 2 **Sprungpads** (x:160, x:600)
- **Besonderheiten**:
  - **Sprungpads** katapultieren Finn zu den Plattformen
  - **Boss Ganondorf** mit 3 Phasen (wird größer, stärker, wilder)
  - Nach Boss-Sieg: **FakePrincess** (Plottwist → Bonus-Level)
  - **Kein Door** — Victory nur über Princess
- **Design-Intention**: Klimax. Erst Orks als Aufwärm, dann epischer Boss-Kampf mit Phasen-Wechseln.

## Level 7: Der Kerker — Bonus Level!
- **Theme**: dark — Dunkelheits-Overlay (wie Level 5)
- **Layout**: 40 Spalten × 16 Reihen = 1280×512 Pixel. Kompakt! Boden Reihe 14-15 mit 2-Tile-Lücken. Start-Fläche 13 Tiles. Trittbretter Reihe 12. Kammer rechts (Stein-Wände).
- **Feinde**: 2× Dunkelheits-Ork, 1× Feuer-Ork, 1× Licht-Ork (alle y:400)
- **Items**: 2 Heiltränke
- **Besonderheit**: **Echte Prinzessin Lea** spawnt wenn alle Feinde besiegt sind (rechte Ecke). Berühren = Victory!
- **Design-Intention**: Emotionaler Abschluss nach dem Plottwist. Kompakter, intensiv, dann die Belohnung.
