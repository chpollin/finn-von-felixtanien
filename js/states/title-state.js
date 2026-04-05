import { GameState } from './state.js';

export class TitleState extends GameState {
    constructor() {
        super();
        this.blinkTimer = 0;
        this.starTimer = 0;
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 400,
                size: 1 + Math.random() * 2,
                speed: 0.3 + Math.random() * 0.7,
            });
        }
    }

    update(dt, game) {
        this.blinkTimer += dt;
        this.starTimer += dt;

        if (game.input.justPressed('Enter') || game.input.justPressed('Space')) {
            game.setState('playing');
        }
    }

    render(ctx, game) {
        const w = game.width;
        const h = game.height;

        // Dunkler Hintergrund
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1e');
        grad.addColorStop(1, '#1a1a3e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Sterne
        for (const s of this.stars) {
            const alpha = 0.4 + Math.sin(this.starTimer * s.speed * 3) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;

        // Schloss-Silhouette im Hintergrund
        ctx.fillStyle = '#151530';
        // Hauptgebäude
        ctx.fillRect(280, 320, 240, 180);
        // Türme
        ctx.fillRect(260, 260, 40, 240);
        ctx.fillRect(500, 260, 40, 240);
        ctx.fillRect(370, 240, 60, 260);
        // Turmspitzen
        ctx.beginPath();
        ctx.moveTo(260, 260); ctx.lineTo(280, 220); ctx.lineTo(300, 260);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(500, 260); ctx.lineTo(520, 220); ctx.lineTo(540, 260);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(370, 240); ctx.lineTo(400, 190); ctx.lineTo(430, 240);
        ctx.fill();

        // Fenster im Schloss
        ctx.fillStyle = '#3a2a50';
        ctx.fillRect(320, 360, 20, 30);
        ctx.fillRect(360, 360, 20, 30);
        ctx.fillRect(420, 360, 20, 30);
        ctx.fillRect(460, 360, 20, 30);

        // Boden
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 500, w, 100);

        // Finn-Silhouette (links)
        ctx.fillStyle = '#2a4a8a';
        ctx.fillRect(140, 448, 20, 48); // Körper
        ctx.fillRect(138, 436, 24, 16); // Kopf
        // Schwert
        ctx.fillStyle = '#aa2200';
        ctx.fillRect(158, 420, 3, 40);

        // --- Titel ---
        ctx.textAlign = 'center';

        // Schatten
        ctx.fillStyle = '#000';
        ctx.font = 'bold 42px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('Finn von Felixtanien', w / 2 + 2, 102);

        // Titel
        ctx.fillStyle = '#e8c44a';
        ctx.fillText('Finn von Felixtanien', w / 2, 100);

        // Untertitel
        ctx.font = '22px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#a8b8d0';
        ctx.fillText('Die Rettung der Prinzessin Lea', w / 2, 140);

        // Story-Snippet
        ctx.font = '14px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#6a7a8a';
        ctx.fillText('Ganondorf hat Prinzessin Lea nach Garnonstadt verschleppt.', w / 2, 180);
        ctx.fillText('Finn, der König von Felixtanien, muss sie befreien!', w / 2, 200);

        // Blinkendes "Start"
        const blink = Math.sin(this.blinkTimer * 3) > 0;
        if (blink) {
            ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('Drücke ENTER zum Starten', w / 2, 480);
        }

        // Controls
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#556';
        ctx.fillText('A/D = Bewegen  |  SPACE = Springen  |  J/X = Angriff  |  ESC = Pause', w / 2, 560);

        ctx.textAlign = 'start';
    }
}
