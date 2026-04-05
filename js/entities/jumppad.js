import { Entity } from '../entity.js';

export class JumpPad extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 32;
        this.height = 10;
        this.launchForce = -600;
        this.timer = 0;
        this.bounceAnim = 0;
    }

    update(dt, game) {
        this.timer += dt;
        if (this.bounceAnim > 0) this.bounceAnim -= dt * 5;

        if (game.player && this.collidesWith(game.player) && game.player.vy >= 0) {
            game.player.vy = this.launchForce;
            game.player.grounded = false;
            this.bounceAnim = 1;
            if (game.audio) game.audio.play('jump');
            if (game.particles) {
                game.particles.emit(this.x + this.width / 2, this.y, 10, {
                    color: '#ff44aa', speed: 100, life: 0.3, size: 3,
                    angle: -Math.PI / 2, spread: Math.PI * 0.6
                });
            }
        }
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const squish = this.bounceAnim > 0 ? Math.sin(this.bounceAnim * Math.PI) * 4 : 0;
        const pulse = Math.sin(this.timer * 4) * 0.5;

        // Basis
        ctx.fillStyle = '#aa3377';
        ctx.fillRect(x + 2, y + 4 + squish, 28, 6 - squish);

        // Feder-Oberfläche
        ctx.fillStyle = '#dd55aa';
        ctx.fillRect(x, y + squish, 32, 5);

        // Glow-Pfeile (↑↑)
        ctx.globalAlpha = 0.5 + pulse * 0.3;
        ctx.fillStyle = '#ff88cc';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('↑', x + 16, y - 4);
        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;

        // Federn (Zick-Zack)
        ctx.strokeStyle = '#cc4488';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 5 + squish);
        ctx.lineTo(x + 11, y + 8);
        ctx.lineTo(x + 8, y + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 5 + squish);
        ctx.lineTo(x + 23, y + 8);
        ctx.lineTo(x + 20, y + 10);
        ctx.stroke();
    }
}
