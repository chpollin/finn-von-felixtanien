# Changelog — Finn von Felixtanien

## 2026-04-05

### Initial Release (Commit: 02055b6)
Komplettes Spiel mit allen Kern-Features:
- 6 Levels (Wald, Höhlen, Lava, Wind, Schatten, Schloss)
- Spieler Finn mit Pixel-Art, Schwertangriff, Sprung
- 6-Element-System mit Schwäche-Kreislauf
- 7 Ork-Varianten + Boss Ganondorf (3 Phasen)
- 6 Element-Fernattacken (K-Taste)
- Game States (Titel, Spielen, Pause, Game Over, Victory)
- Retro-Sound via Web Audio API
- Partikel, Screen-Shake, Vignette

### Kamera-Fix (Commit: 1f44c60)
**Bug**: Beim Level-Wechsel behielt die Kamera die Position des vorherigen Levels. Im Schattenpfad (nach Windklippen) startete man deswegen am oberen Rand.
**Fix**: `camera.snapTo(player)` beim Level-Laden — sofortige Positionierung statt Lerp.

### Level 7 Kerker Fix (Commit: 7322e84)
**Bug**: Spieler und Orks starteten unterhalb des Bodens (y:480 aber Boden bei y:448).
**Fix**: Alle Y-Positionen an Tile-Grid angepasst. Startfläche verbreitert. Trittbretter hinzugefügt.

### Level 1 Redesign (Commit: 40f7f08)
**Änderung**: Plattformen, Gruben und Tutorial-Schilder entfernt. Durchgehender Boden. 7 Orks gleichmäßig verteilt. Reines Durchkämpf-Level.
**Begründung**: Level 1 soll Kampf lehren, nicht Platforming. Schilder waren unnötig — man lernt durch Spielen.

### Vorher implementierte Features (in chronologischer Reihenfolge)
1. **Phase 1**: Spieler Finn mit Bewegung, Sprung, Pixel-Art
2. **Phase 2**: Tile-System, Kamera mit Lerp-Smoothing
3. **Phase 3**: Kampfsystem mit Schwert-Schwung-Animation
4. **Phase 4**: Ork-Feinde mit KI State-Machine
5. **Phase 5**: Game States und UI (Titel, Pause, Game Over, Victory)
6. **Phase 6**: Element-System mit 6 Elementen, Orbs, HUD, Element-Orks
7. **Phase 7**: 6 Level-Definitionen, Doors, Signs, Items, Parallax
8. **Phase 8**: Boss Ganondorf (3 Phasen), Prinzessin Lea
9. **Phase 9**: Audio (Web Audio API), Screen-Effekte
10. **Fernattacken**: 6 Element-spezifische Projektile (K-Taste)
11. **Tornado-Mount**: Fliegbares Reittier mit Sprüchen für Level 4
12. **CloudGrumps**: Grummelige Gewitterwolken als fliegende Gegner
13. **Sprungpads**: Katapultieren Spieler zu hohen Plattformen (Level 6)
14. **Plottwist**: FakePrincess (verkleideter Ork) + Bonus-Level 7 (Kerker)
15. **Boss-Überarbeitung**: 3 echte Phasen mit Größen-Wachstum, Sprüchen, Slam, visuellen Änderungen
16. **Bugfixes**: Level 2/3/5 Boden, Enemy-Positionen, Princess Race-Condition, Vine/Curse Timer (dt-basiert)
