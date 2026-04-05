/**
 * Erstellt die Hitbox für einen Schwerthieb.
 * Gibt {x, y, width, height} zurück.
 */
export function createAttackHitbox(attacker, facingRight, range = 40, hitHeight = 32) {
    const hx = facingRight
        ? attacker.x + attacker.width
        : attacker.x - range;
    const hy = attacker.y + (attacker.height - hitHeight) / 2;
    return { x: hx, y: hy, width: range, height: hitHeight };
}

/**
 * Wendet Knockback auf ein Ziel an.
 */
export function applyKnockback(target, sourceX, forceX = 250, forceY = -150) {
    const dir = target.x + target.width / 2 > sourceX ? 1 : -1;
    target.vx = dir * forceX;
    target.vy = forceY;
    if (target.grounded !== undefined) target.grounded = false;
}

/**
 * Fügt Schaden zu. Gibt tatsächlichen Schaden zurück.
 * Element-Multiplikator wird in Phase 6 ergänzt.
 */
export function dealDamage(target, amount, element = null) {
    if (!target.takeDamage) return 0;
    return target.takeDamage(amount, element);
}

/**
 * Prüft AABB-Überlappung zwischen Hitbox {x,y,width,height} und Entity.
 */
export function hitboxOverlaps(hitbox, entity) {
    return (
        hitbox.x < entity.x + entity.width &&
        hitbox.x + hitbox.width > entity.x &&
        hitbox.y < entity.y + entity.height &&
        hitbox.y + hitbox.height > entity.y
    );
}
