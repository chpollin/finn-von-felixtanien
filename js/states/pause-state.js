import { GameState } from './state.js';

export class PauseState extends GameState {
    constructor() {
        super();
        this.selected = 0;
        this.options = ['Weiter', 'Neustart', 'Hauptmenü'];
    }

    enter(game) {
        this.selected = 0;
    }

    update(dt, game) {
        if (game.input.justPressed('Escape')) {
            game.setState('playing-resume');
            return;
        }

        if (game.input.justPressed('ArrowUp') || game.input.justPressed('KeyW')) {
            this.selected = (this.selected - 1 + this.options.length) % this.options.length;
        }
        if (game.input.justPressed('ArrowDown') || game.input.justPressed('KeyS')) {
            this.selected = (this.selected + 1) % this.options.length;
        }

        if (game.input.justPressed('Enter') || game.input.justPressed('Space')) {
            switch (this.selected) {
                case 0: game.setState('playing-resume'); break;
                case 1: game.setState('playing'); break;
                case 2: game.setState('title'); break;
            }
        }
    }

    render(ctx, game) {
        // Spielszene darunter (halbtransparent)
        const playingState = game.states.get('playing');
        if (playingState) playingState.render(ctx, game);

        // Dunkles Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, game.width, game.height);

        // PAUSE Titel
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('PAUSE', game.width / 2, 200);

        // Optionen
        ctx.font = '22px "Segoe UI", system-ui, sans-serif';
        for (let i = 0; i < this.options.length; i++) {
            const isSelected = i === this.selected;
            ctx.fillStyle = isSelected ? '#e8c44a' : '#888';
            const prefix = isSelected ? '► ' : '  ';
            ctx.fillText(prefix + this.options[i], game.width / 2, 290 + i * 45);
        }

        ctx.textAlign = 'start';
    }
}
