import { Item } from './item.js';

export class HealthPotion extends Item {
    constructor(x, y) {
        super(x, y);
        this.healAmount = 30;
    }

    onPickup(game) {
        const p = game.player;
        p.health = Math.min(p.maxHealth, p.health + this.healAmount);
        if (game.audio) game.audio.play('pickup');
        if (game.particles) {
            game.particles.emit(this.x + 8, this.y + 8, 10, {
                color: '#f44', speed: 80, life: 0.5, size: 3
            });
            game.particles.showDamage(this.x + 8, this.y - 10, '+' + this.healAmount, '#4f4');
        }
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        // Flasche
        ctx.fillStyle = '#a22';
        ctx.fillRect(x + 3, y + 4, 10, 10);
        // Flaschenhals
        ctx.fillStyle = '#c44';
        ctx.fillRect(x + 5, y + 1, 6, 4);
        // Korken
        ctx.fillStyle = '#a86';
        ctx.fillRect(x + 6, y, 4, 2);
        // Highlight
        ctx.fillStyle = '#e66';
        ctx.fillRect(x + 4, y + 5, 2, 4);
        // Herz-Symbol
        ctx.fillStyle = '#f88';
        ctx.fillRect(x + 6, y + 7, 2, 2);
        ctx.fillRect(x + 9, y + 7, 2, 2);
        ctx.fillRect(x + 5, y + 8, 6, 2);
        ctx.fillRect(x + 6, y + 10, 4, 1);
        ctx.fillRect(x + 7, y + 11, 2, 1);
    }
}
