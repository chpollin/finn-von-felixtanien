import { Entity } from '../entity.js';

export class Item extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 16;
        this.height = 16;
        this.baseY = y;
        this.timer = Math.random() * Math.PI * 2;
    }

    update(dt, game) {
        this.timer += dt * 3;
        this.y = this.baseY + Math.sin(this.timer) * 4;

        if (game.player && this.collidesWith(game.player)) {
            this.onPickup(game);
            this.destroy();
        }
    }

    onPickup(game) {
        // Override
    }
}
