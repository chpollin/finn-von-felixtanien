// Tile-Typen
export const TILE = {
    EMPTY: 0,
    GROUND: 1,
    STONE: 2,
    PLATFORM: 3,
    SPIKE: 4,
    GRASS_TOP: 5,  // Gras-Oberfläche (solid)
};

const SOLID_TILES = new Set([TILE.GROUND, TILE.STONE, TILE.PLATFORM, TILE.GRASS_TOP]);

export class TileMap {
    constructor(grid, tileSize = 32) {
        this.grid = grid;
        this.tileSize = tileSize;
        this.rows = grid.length;
        this.cols = grid[0].length;
        this.widthPx = this.cols * tileSize;
        this.heightPx = this.rows * tileSize;
    }

    getTile(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return TILE.EMPTY;
        return this.grid[row][col];
    }

    getTileAtWorld(wx, wy) {
        const col = Math.floor(wx / this.tileSize);
        const row = Math.floor(wy / this.tileSize);
        return this.getTile(col, row);
    }

    isSolid(col, row) {
        return SOLID_TILES.has(this.getTile(col, row));
    }

    isSolidAtWorld(wx, wy) {
        return SOLID_TILES.has(this.getTileAtWorld(wx, wy));
    }

    /** Prüft Kollision einer Entity mit Tiles und korrigiert Position */
    resolveCollision(entity) {
        const ts = this.tileSize;

        // --- Horizontale Kollision ---
        {
            const top = Math.floor(entity.y / ts);
            const bottom = Math.floor((entity.y + entity.height - 1) / ts);

            if (entity.vx > 0) {
                // Rechte Seite prüfen
                const col = Math.floor((entity.x + entity.width) / ts);
                for (let row = top; row <= bottom; row++) {
                    if (this.isSolid(col, row)) {
                        entity.x = col * ts - entity.width;
                        entity.vx = 0;
                        break;
                    }
                }
            } else if (entity.vx < 0) {
                // Linke Seite prüfen
                const col = Math.floor(entity.x / ts);
                for (let row = top; row <= bottom; row++) {
                    if (this.isSolid(col, row)) {
                        entity.x = (col + 1) * ts;
                        entity.vx = 0;
                        break;
                    }
                }
            }
        }

        // --- Vertikale Kollision ---
        {
            const left = Math.floor(entity.x / ts);
            const right = Math.floor((entity.x + entity.width - 1) / ts);

            if (entity.vy > 0) {
                // Untere Seite prüfen (Boden)
                const row = Math.floor((entity.y + entity.height) / ts);
                for (let col = left; col <= right; col++) {
                    if (this.isSolid(col, row)) {
                        entity.y = row * ts - entity.height;
                        entity.vy = 0;
                        entity.grounded = true;
                        return;
                    }
                }
            } else if (entity.vy < 0) {
                // Obere Seite prüfen (Decke)
                const row = Math.floor(entity.y / ts);
                for (let col = left; col <= right; col++) {
                    if (this.isSolid(col, row)) {
                        entity.y = (row + 1) * ts;
                        entity.vy = 0;
                        break;
                    }
                }
            }
        }
    }

    render(ctx, camera) {
        const ts = this.tileSize;

        // Nur sichtbare Tiles zeichnen (Viewport-Culling)
        const startCol = Math.max(0, Math.floor(camera.x / ts));
        const endCol = Math.min(this.cols - 1, Math.floor((camera.x + camera.viewWidth) / ts));
        const startRow = Math.max(0, Math.floor(camera.y / ts));
        const endRow = Math.min(this.rows - 1, Math.floor((camera.y + camera.viewHeight) / ts));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = this.grid[row][col];
                if (tile === TILE.EMPTY) continue;

                const x = col * ts;
                const y = row * ts;

                this.renderTile(ctx, tile, x, y, col, row);
            }
        }
    }

    renderTile(ctx, tile, x, y, col, row) {
        const ts = this.tileSize;

        switch (tile) {
            case TILE.GRASS_TOP:
                // Erde mit Gras oben
                ctx.fillStyle = '#5c3a1e';
                ctx.fillRect(x, y, ts, ts);
                // Gras-Schicht
                ctx.fillStyle = '#3a8a3a';
                ctx.fillRect(x, y, ts, 6);
                // Gras-Halme
                ctx.fillStyle = '#4a9a4a';
                ctx.fillRect(x + 2, y - 2, 2, 4);
                ctx.fillRect(x + 10, y - 1, 2, 3);
                ctx.fillRect(x + 20, y - 2, 2, 4);
                ctx.fillRect(x + 28, y - 1, 2, 3);
                break;

            case TILE.GROUND:
                // Erde
                ctx.fillStyle = '#5c3a1e';
                ctx.fillRect(x, y, ts, ts);
                // Textur-Details
                ctx.fillStyle = '#4a2f18';
                ctx.fillRect(x + 4, y + 8, 3, 3);
                ctx.fillRect(x + 18, y + 20, 4, 2);
                ctx.fillRect(x + 10, y + 4, 2, 2);
                break;

            case TILE.STONE:
                // Stein-Block
                ctx.fillStyle = '#6a6a7a';
                ctx.fillRect(x, y, ts, ts);
                // Fugen
                ctx.fillStyle = '#555566';
                ctx.fillRect(x, y, ts, 1);
                ctx.fillRect(x, y, 1, ts);
                // Risse/Details
                ctx.fillStyle = '#5a5a6a';
                ctx.fillRect(x + 8, y + 6, 6, 2);
                ctx.fillRect(x + 16, y + 18, 8, 2);
                // Highlight
                ctx.fillStyle = '#7a7a8a';
                ctx.fillRect(x + 1, y + 1, ts - 2, 1);
                break;

            case TILE.PLATFORM:
                // Holz-Plattform
                ctx.fillStyle = '#8b6914';
                ctx.fillRect(x, y, ts, 10);
                // Holzmaserung
                ctx.fillStyle = '#7a5a10';
                ctx.fillRect(x + 2, y + 3, ts - 4, 2);
                // Plattform-Stütze
                ctx.fillStyle = '#6b5210';
                ctx.fillRect(x + 12, y + 10, 8, 6);
                break;

            case TILE.SPIKE:
                // Stacheln (tödlich)
                ctx.fillStyle = '#888';
                for (let i = 0; i < 4; i++) {
                    const sx = x + i * 8;
                    ctx.beginPath();
                    ctx.moveTo(sx, y + ts);
                    ctx.lineTo(sx + 4, y + 8);
                    ctx.lineTo(sx + 8, y + ts);
                    ctx.closePath();
                    ctx.fill();
                }
                // Spitzen-Glanz
                ctx.fillStyle = '#aaa';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(x + i * 8 + 3, y + 10, 2, 2);
                }
                break;
        }
    }
}
