import { OrcBasic } from './orc-basic.js';
import { OrcFire } from './orc-fire.js';
import { OrcWater } from './orc-water.js';
import { OrcEarth } from './orc-earth.js';
import { OrcAir } from './orc-air.js';
import { OrcDark } from './orc-dark.js';
import { OrcLight } from './orc-light.js';

const ENEMY_TYPES = {
    'orc-basic': OrcBasic,
    'orc-fire': OrcFire,
    'orc-water': OrcWater,
    'orc-earth': OrcEarth,
    'orc-air': OrcAir,
    'orc-dark': OrcDark,
    'orc-light': OrcLight,
};

export function spawnEnemiesForLevel(game, levelData) {
    for (const def of levelData.enemies) {
        const EnemyClass = ENEMY_TYPES[def.type];
        if (!EnemyClass) continue;

        const enemy = new EnemyClass(def.x, def.y);
        if (def.patrolRange !== undefined) enemy.patrolRange = def.patrolRange;
        enemy.patrolOrigin = def.x;

        const scoreValue = def.score || 100;
        const origOnDeath = enemy.onDeath.bind(enemy);
        enemy.onDeath = () => {
            game.score += scoreValue;
            if (game.particles) {
                game.particles.emitHit(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    '#4f4'
                );
            }
            origOnDeath();
        };

        game.addEntity(enemy);
    }
}
