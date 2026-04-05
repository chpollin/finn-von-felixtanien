# Spieldesign — Finn von Felixtanien

## Story

**Finn**, König von **Felixtanien**, ist ein erfahrener und ernster Schwertkämpfer. Er hat bereits viele Abenteuer erlebt.

**Ganondorf**, der böse König von **Garnonstadt**, hat **Prinzessin Lea** entführt und in sein Schloss verschleppt. Lea ist immer fröhlich — selbst in Gefangenschaft.

Finn muss sich durch 6 Gebiete kämpfen, Ganondorfs Ork-Armee besiegen und Lea aus dem Schloss befreien.

## Charaktere

### Finn (Spieler)
- **Aussehen**: Blaues Hemd, beige Hose, braune Haare, braune Schuhe
- **Waffe**: Rotes Katana (in einer Hand gehalten)
- **Persönlichkeit**: Ernst, entschlossen, erfahrener Held
- **Stats**: 100 HP, Angriff 25, Speed 220

### Prinzessin Lea
- **Aussehen**: Rosa Kleid, blonde Haare, goldene Krone, blaue Augen
- **Persönlichkeit**: Immer fröhlich, lächelt
- **Rolle**: Erscheint nach Boss-Sieg, berühren = Victory

### Ganondorf (Endboss)
- **Aussehen**: Großer Ork mit Krone, schwere Rüstung, großes Schwert
- **Herrschaftsgebiet**: Garnonstadt (böses Schloss)
- **Kampf**: 3 Phasen
  - Phase 1 (100-50% HP): Langsame Hiebe, Sprungattacke
  - Phase 2 (50-25% HP): Schneller, ruft Hilfs-Orks
  - Phase 3 (25-0% HP): Wut-Modus (glüht rot), wechselt Element
- **Stats**: 400 HP, Schaden 25-35

### Orks (Schweinemenschen)
Ganondorfs Armee. Humanoid mit rosa Schweinekopf, Schnauze, Hauern, roten Augen. Tragen Holzkeulen.

| Typ | Element | Farbe | Besonderheit |
|-----|---------|-------|-------------|
| Basic | — | Grün | Standard, mittlere Stats |
| Feuer | Feuer | Orange/Rot | Schnell, weniger HP |
| Wasser | Wasser | Blau | Langsam, viel HP |
| Erde | Erde | Braun/Grün | Sehr langsam, massiv, Steinrüstung |
| Luft | Luft | Hellblau | Sehr schnell, schwebt leicht |
| Dunkelheit | Dunkelheit | Lila | Wird periodisch unsichtbar |
| Licht | Helligkeit | Gelb | Leuchtet |

## Steuerung

| Taste | Aktion |
|-------|--------|
| A / D / Pfeiltasten | Bewegen |
| Space / W / Pfeil-hoch | Springen |
| J / X / Mausklick | Nahkampf (Schwerthieb) |
| K | Fernattacke (benötigt aktives Element) |
| 1-6 | Element direkt wählen |
| Q / E | Durch gesammelte Elemente schalten |
| ESC | Pause |
| M | Mute/Unmute |

## Element-System

### 6 Elemente
1. **Feuer** (#ff4400) — Effektiv gegen Erde
2. **Wasser** (#0088ff) — Effektiv gegen Feuer
3. **Erde** (#88aa00) — Effektiv gegen Luft
4. **Luft** (#aaeeff) — Effektiv gegen Wasser
5. **Dunkelheit** (#8844cc) — Effektiv gegen Licht
6. **Helligkeit** (#ffee00) — Effektiv gegen Dunkelheit

### Schwäche-Kreislauf
```
Feuer → Erde → Luft → Wasser → Feuer
Dunkelheit ↔ Helligkeit
```
- Effektiv = 2x Schaden + "SUPER!" Feedback + stärkerer Knockback
- Schwach = 0.5x Schaden
- Neutral = 1x Schaden

### Sammeln & Aktivieren
- Element-Orbs sind in Levels verstreut (leuchtende, schwebende Kugeln)
- Eingesammelte Elemente bleiben über Level-Wechsel erhalten
- Aktives Element beeinflusst Schwertfarbe, Nahkampf-Multiplikator und Fernattacke

### Fernattacken (K-Taste)
| Element | Angriff | Effekt | Cooldown |
|---------|---------|--------|----------|
| Feuer | Feuerball | Fliegt horizontal, 30 Schaden | 1.2s |
| Wasser | Welle | Breite Welle, kein Schaden, schiebt zurück | 1.2s |
| Erde | Liane | Verwurzelt Gegner 2s + Dornen-DoT (4x5) | 1.2s |
| Luft | Tornado | Wirbel, schleudert Gegner hoch | 1.2s |
| Dunkelheit | Fluch | Markiert Gegner: 2x Schaden für 4s | 1.2s |
| Helligkeit | Laser | Lichtsäule von oben, Vorwarnung, 35 Schaden | 1.2s |

## Levels

### Level 1: Der Wald von Felixtanien
- **Theme**: Wald (Gras, Erde, grüner Himmel)
- **Schwierigkeit**: Tutorial
- **Feinde**: Basic-Orks, 1 Erd-Ork, 1 Feuer-Ork
- **Items**: Feuer-Orb, Heiltrank
- **Besonderheit**: Tutorial-Schilder, 2 Gruben

### Level 2: Die Tiefen Höhlen
- **Theme**: Höhle (Stein-Wände, dunkel)
- **Schwierigkeit**: Leicht-Mittel
- **Feinde**: Basic-Orks, Erd-Orks
- **Items**: Wasser-Orb, Heiltrank

### Level 3: Der Flammende Fluss
- **Theme**: Lava (rötlich, Stacheln = Lava)
- **Schwierigkeit**: Mittel
- **Feinde**: Feuer-Orks, 1 Basic-Ork
- **Items**: Erde-Orb, 2 Heiltränke
- **Besonderheit**: Stacheln am Boden, Plattform-Jumping

### Level 4: Die Windklippen
- **Theme**: Himmel (blauer Gradient, Wolken-Feeling)
- **Schwierigkeit**: Mittel-Schwer
- **Feinde**: Luft-Orks
- **Items**: Luft-Orb, Heiltrank
- **Besonderheit**: Vertikales Level, aufwärts springen

### Level 5: Der Schattenpfad
- **Theme**: Dunkel (eingeschränkte Sicht via radialem Overlay)
- **Schwierigkeit**: Schwer
- **Feinde**: Dunkelheits-Orks, 1 Licht-Ork
- **Items**: Licht-Orb, 2 Heiltränke
- **Besonderheit**: Sichtkreis um Spieler, Rest dunkel

### Level 6: Schloss Garnonstadt
- **Theme**: Schloss (Stein-Innenraum, dunkel)
- **Schwierigkeit**: Endgame
- **Feinde**: Alle Ork-Typen + Boss Ganondorf
- **Items**: Dunkelheit-Orb, 2 Heiltränke
- **Besonderheit**: Boss-Arena, Ganondorf mit 3 Phasen, Prinzessin Lea nach Sieg

## Spielmechaniken

### Kampfsystem
- **Nahkampf (J/X)**: Schwert schwingt in Bogen, Hitbox aktiv während Animation (0.3s), 1 Treffer pro Schwung
- **Fernattacke (K)**: Element-spezifisches Projektil, 1.2s Cooldown, benötigt aktives Element
- **Knockback**: Getroffene Gegner werden zurückgestoßen
- **i-Frames**: Spieler blinkt 0.8s nach Treffer, Gegner 0.4s

### Feind-KI
State-Machine mit 5 Zuständen:
1. **PATROL**: Läuft zwischen 2 Punkten, dreht bei Kanten um
2. **CHASE**: Spieler in Sichtweite → verfolgen
3. **ATTACK**: In Nahkampf-Reichweite → zuschlagen + Knockback
4. **HURT**: Kurze Unterbrechung nach Treffer
5. **DEAD**: Blink-Animation, dann entfernt

### Progression
- Elemente werden über Level-Wechsel mitgenommen
- Score wird kumuliert
- 6 Levels linear durchgespielt
- Sieg: Ganondorf besiegen → Lea berühren → Victory-Screen
