export class Input {
    constructor(canvas) {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, down: false };

        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }

    isKeyDown(code) {
        return this.keys.has(code);
    }
}
