# Spieldesign — Finn von Felixtanien

## Story

**Finn**, König von **Felixtanien**, ist ein erfahrener und ernster Schwertkämpfer mit vielen Abenteuern hinter sich.

**Ganondorf**, der böse König von **Garnonstadt**, hat **Prinzessin Lea** entführt und in seinem Schloss eingesperrt. Lea ist immer fröhlich — selbst in Gefangenschaft.

Finn kämpft sich durch 7 Gebiete, besiegt Ganondorfs Ork-Armee und befreit Lea.

### Plottwist
Nach dem Boss-Kampf in Level 6 erscheint "Prinzessin Lea" — doch es ist ein **verkleideter Ork**! Er lacht, zeigt sein wahres Gesicht und flieht. Die echte Lea ist im **Kerker** (Bonus-Level 7). Finn muss alle Wachen besiegen um sie zu befreien.

## Charaktere

### Finn (Spieler)
- **Aussehen**: Blaues Hemd, beige Hose, braune Haare/Schuhe
- **Waffe**: Rotes Katana (in einer Hand)
- **Persönlichkeit**: Ernst, entschlossen
- **Stats**: 100 HP, Angriff 25, Speed 220

### Prinzessin Lea
- **Aussehen**: Rosa Kleid, blonde Haare, goldene Krone, blaue Augen
- **Persönlichkeit**: Immer fröhlich, lächelt
- **Rolle**: Echte Lea in Level 7 (Kerker), Berühren = Victory

### Ganondorf (Endboss)
- **Aussehen**: Großer Ork mit Krone, schwere Rüstung, großes Schwert
- **Herrschaftsgebiet**: Garnonstadt (böses Schloss)
- **3 Phasen**:
  - **Phase 1** (100-50% HP): Sprungattacken, ruhige Sprüche. Normal-Größe.
  - **Phase 2** (50-25% HP): Wird größer (56x72), orange Aura, ruft Hilfs-Orks, schneller. Sprüche: *"MEINE MACHT WÄCHST!"*
  - **Phase 3** (25-0% HP): Noch größer (64x80), rote Flammen-Aura, Boden-Slam, 3 Orks gleichzeitig, Element-Wechsel, Krone bekommt mehr Zacken. Sprüche: *"ALLES WIRD BRENNEN!!"*
- **Stats**: 400 HP, Schaden 25→35

### Orks (Schweinemenschen)
Ganondorfs Armee. Humanoid mit rosa Schweinekopf, Schnauze, Hauern, roten Augen. Holzkeulen.

| Typ | Element | Farbe | HP | Speed | Besonderheit |
|-----|---------|-------|-----|-------|-------------|
| Basic | — | Grün | 60 | 55/95 | Standard |
| Feuer | Feuer | Orange | 50 | 75/130 | Schnell, Flammen |
| Wasser | Wasser | Blau | 90 | 40/70 | Langsam, tanky |
| Erde | Erde | Braun | 120 | 30/50 | Massiv, Steinrüstung |
| Luft | Luft | Hellblau | 40 | 90/160 | Sehr schnell, schwebt |
| Dunkelheit | Dunkelheit | Lila | 70 | 60/110 | Periodisch unsichtbar |
| Licht | Helligkeit | Gelb | 65 | 55/100 | Leuchtend |

### Grummelige Gewitterwolken (Level 4)
Das Gegenteil des lustigen Tornado-Reittiers. Düstere, fliegende Wolken mit grimmigem Gesicht.
- Fliegen hin und her, schießen **Blitze** nach unten wenn Finn darunter ist
- Werden wütend wenn getroffen
- Grummelige Sprüche: *"Ich HASSE Sonnenschein!"*, *"Spaß? Was ist das?!"*, *"Tornados sind SO nervig!"*
- Dunkle Sprechblasen mit rotem Text

### Tornado-Reittier "Wirbel-Werner" (Level 4)
Freundlicher Tornado mit Gesicht und Grinsen. Finn kann aufsteigen und frei fliegen.
- Lustige Sprüche: *"Ich pupse Wind. Also... quasi immer."*, *"Weißt du was Wolken schmecken? Watte!"*
- Weiße Sprechblasen, blinzelt, streckt Zunge raus

## Steuerung

| Taste | Aktion |
|-------|--------|
| A/D / Pfeiltasten | Bewegen |
| Space / W / Pfeil-hoch | Springen (auf Mount: hoch fliegen) |
| S (auf Mount) | Runter fliegen |
| J / X / Mausklick | Nahkampf (Schwerthieb) |
| K | Fernattacke (benötigt aktives Element) |
| 1-6 | Element direkt wählen |
| Q / E | Durch gesammelte Elemente schalten |
| Shift | Vom Mount absteigen |
| ESC | Pause |
| M | Mute/Unmute |

## Element-System

### 6 Elemente im Schwäche-Kreislauf
```
Feuer (#ff4400) → Erde (#88aa00) → Luft (#aaeeff) → Wasser (#0088ff) → Feuer
Dunkelheit (#8844cc) ↔ Helligkeit (#ffee00)
```
Effektiv = 2x Schaden + "SUPER!" + stärkerer Knockback. Schwach = 0.5x.

### Fernattacken (K-Taste, 1.2s Cooldown)
| Element | Angriff | Effekt |
|---------|---------|--------|
| Feuer | Feuerball | Horizontal, 30 Schaden |
| Wasser | Welle | Breite Welle, kein Schaden, pusht zurück |
| Erde | Liane | Verwurzelt 2s + Dornen-DoT (4x5 Schaden) |
| Luft | Tornado | Wirbel, schleudert Gegner hoch |
| Dunkelheit | Fluch | Markiert Gegner: 2x Schaden für 4s |
| Helligkeit | Laser | Lichtsäule von oben mit Vorwarnung, 35 Schaden |

## Kampfsystem

- **Nahkampf (J/X)**: Katana-Schwung im Bogen (0.3s), 1 Treffer pro Schwung, Element-Multiplikator
- **Fernattacke (K)**: Element-spezifisch, 1.2s Cooldown
- **Knockback**: Getroffene Entities werden zurückgestoßen (stärker bei Super-Effektiv)
- **i-Frames**: Spieler 0.8s, Gegner 0.4s
- **Mount**: Finn kann auf Tornado reiten (Level 4), Steuerung wechselt zu Flug

## Feind-KI (State-Machine)
1. **PATROL**: Läuft hin/her, dreht bei Kanten um
2. **CHASE**: Spieler in Sichtweite → verfolgen, Kantenerkennung
3. **ATTACK**: Nahkampf-Reichweite → zuschlagen + Knockback auf Spieler
4. **HURT**: Kurze Unterbrechung nach Treffer
5. **DEAD**: Blink/Fade-Animation → entity.destroy()
