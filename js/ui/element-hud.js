import { ELEMENT_DATA } from '../elements.js';

const ELEMENT_ORDER = ['fire', 'water', 'earth', 'air', 'dark', 'light'];
const KEY_LABELS = ['1', '2', '3', '4', '5', '6'];

export class ElementHUD {
    render(ctx, player, screenWidth) {
        if (!player || !player.elements) return;

        const collected = player.elements;
        if (collected.size === 0) return;

        const startX = screenWidth / 2 - (ELEMENT_ORDER.length * 40) / 2;
        const y = 565;

        for (let i = 0; i < ELEMENT_ORDER.length; i++) {
            const elem = ELEMENT_ORDER[i];
            const has = collected.has(elem);
            const isActive = player.activeElement === elem;
            const x = startX + i * 40 + 20;

            if (!has) {
                // Leerer Slot
                ctx.globalAlpha = 0.2;
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                continue;
            }

            const data = ELEMENT_DATA[elem];
            const r = isActive ? 14 : 11;

            // Aktiver Glow
            if (isActive) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = data.glow;
                ctx.beginPath();
                ctx.arc(x, y, r + 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Kugel
            ctx.globalAlpha = isActive ? 1 : 0.6;
            ctx.fillStyle = data.color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Rahmen
            ctx.strokeStyle = isActive ? '#fff' : '#666';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            // Taste
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#fff';
            ctx.font = '9px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(KEY_LABELS[i], x, y + r + 12);

            ctx.globalAlpha = 1;
        }

        // Aktives Element Name
        if (player.activeElement) {
            const data = ELEMENT_DATA[player.activeElement];
            ctx.fillStyle = data.color;
            ctx.font = '12px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(data.name, screenWidth / 2, 540);
        }

        ctx.textAlign = 'start';
    }
}
