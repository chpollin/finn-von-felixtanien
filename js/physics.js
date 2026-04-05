// Physik-Konstanten
export const GRAVITY = 800;
export const TERMINAL_VELOCITY = 600;
export const FRICTION = 0.85;

export function applyGravity(entity, dt) {
    entity.vy += GRAVITY * dt;
    if (entity.vy > TERMINAL_VELOCITY) {
        entity.vy = TERMINAL_VELOCITY;
    }
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
