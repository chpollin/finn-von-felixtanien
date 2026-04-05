export class Input {
    constructor(canvas) {
        this.keys = new Set();
        this.prevKeys = new Set();
        this.mouse = { x: 0, y: 0, down: false, justDown: false };
        this._mouseWasDown = false;

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

    /** Gibt true nur im ersten Frame zurück, in dem die Taste gedrückt wird */
    justPressed(code) {
        return this.keys.has(code) && !this.prevKeys.has(code);
    }

    /** Am Ende jedes Frames aufrufen */
    endFrame() {
        this.prevKeys = new Set(this.keys);
        this.mouse.justDown = this.mouse.down && !this._mouseWasDown;
        this._mouseWasDown = this.mouse.down;
    }
}
