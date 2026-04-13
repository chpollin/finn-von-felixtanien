// Schwierigkeitsgrad-Presets
// Normal = exakt aktuelle Spielwerte (1.0x auf alles)

export const DIFFICULTY_PRESETS = {
    leicht: {
        label: 'Leicht',
        description: 'Für Einsteiger und jüngere Helden',
        color: '#44aa88',
        scoreMultiplier: 0.5,
        player: {
            maxHealth: 150,
            attackPower: 30,
            invincibleDuration: 1.2,
        },
        enemy: {
            healthMult: 0.6,
            damageMult: 0.5,
            speedMult: 0.85,
            chaseSpeedMult: 0.8,
            sightRangeMult: 0.8,
        },
        boss: {
            healthMult: 0.6,
            damageMult: 0.5,
            phase2Threshold: 0.35,
            phase3Threshold: 0.15,
            summonIntervalMult: 1.5,
            minionHealthMult: 0.6,
        },
        potionHealMult: 1.5,
        fallDamageMult: 0.5,
        fallSafe: true, // Kann nicht durch Fallen sterben
    },
    normal: {
        label: 'Normal',
        description: 'Das klassische Abenteuer',
        color: '#e8c44a',
        scoreMultiplier: 1.0,
        player: {
            maxHealth: 100,
            attackPower: 25,
            invincibleDuration: 0.8,
        },
        enemy: {
            healthMult: 1.0,
            damageMult: 1.0,
            speedMult: 1.0,
            chaseSpeedMult: 1.0,
            sightRangeMult: 1.0,
        },
        boss: {
            healthMult: 1.0,
            damageMult: 1.0,
            phase2Threshold: 0.5,
            phase3Threshold: 0.25,
            summonIntervalMult: 1.0,
            minionHealthMult: 1.0,
        },
        potionHealMult: 1.0,
        fallDamageMult: 1.0,
        fallSafe: false,
    },
    schwer: {
        label: 'Schwer',
        description: 'Nur für echte Krieger',
        color: '#cc4444',
        scoreMultiplier: 2.0,
        player: {
            maxHealth: 75,
            attackPower: 20,
            invincibleDuration: 0.5,
        },
        enemy: {
            healthMult: 1.4,
            damageMult: 1.5,
            speedMult: 1.15,
            chaseSpeedMult: 1.25,
            sightRangeMult: 1.3,
        },
        boss: {
            healthMult: 1.5,
            damageMult: 1.5,
            phase2Threshold: 0.6,
            phase3Threshold: 0.35,
            summonIntervalMult: 0.7,
            minionHealthMult: 1.3,
        },
        potionHealMult: 0.7,
        fallDamageMult: 1.5,
        fallSafe: false,
    },
};

/** Gibt das aktive Difficulty-Preset zurück */
export function getDifficulty(game) {
    return DIFFICULTY_PRESETS[game.difficulty || 'normal'];
}
