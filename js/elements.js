export const ELEMENTS = {
    FIRE:  'fire',
    WATER: 'water',
    EARTH: 'earth',
    AIR:   'air',
    DARK:  'dark',
    LIGHT: 'light',
};

export const ELEMENT_DATA = {
    fire:  { name: 'Feuer',       color: '#ff4400', glow: '#ff8800' },
    water: { name: 'Wasser',      color: '#0088ff', glow: '#44aaff' },
    earth: { name: 'Erde',        color: '#88aa00', glow: '#aacc44' },
    air:   { name: 'Luft',        color: '#aaeeff', glow: '#ccffff' },
    dark:  { name: 'Dunkelheit',  color: '#8844cc', glow: '#aa66ee' },
    light: { name: 'Helligkeit',  color: '#ffee00', glow: '#ffff88' },
};

// Schwäche-Matrix: Angreifer → Verteidiger = Multiplikator
const WEAKNESS = {
    fire:  { earth: 2.0, water: 0.5 },
    water: { fire: 2.0, air: 0.5 },
    earth: { air: 2.0, fire: 0.5 },
    air:   { water: 2.0, earth: 0.5 },
    dark:  { light: 2.0, dark: 0.5 },
    light: { dark: 2.0, light: 0.5 },
};

/**
 * Gibt Schadens-Multiplikator zurück.
 * 2.0 = super effektiv, 0.5 = nicht effektiv, 1.0 = neutral
 */
export function getEffectiveness(attackElement, defenseElement) {
    if (!attackElement || !defenseElement) return 1.0;
    const map = WEAKNESS[attackElement];
    if (!map) return 1.0;
    return map[defenseElement] || 1.0;
}

export function getElementColor(element) {
    return ELEMENT_DATA[element]?.color || '#fff';
}

export function getElementGlow(element) {
    return ELEMENT_DATA[element]?.glow || '#fff';
}

export function getElementName(element) {
    return ELEMENT_DATA[element]?.name || '';
}
