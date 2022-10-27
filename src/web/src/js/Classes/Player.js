export class Player {
    constructor(game, clientId, color=[255, 0, 0]) {
        this.game = game;

        this.clientId = clientId;
        this.x = 0;
        this.y = 0;

        this.color = color;
    }

    update() {

    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, 35, 35);
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fill();
    }

    incrementPosition(x, y) {
        this.x += x;
        this.y += y;

        this.game.socket.emit('clientUpdate', {
            code: 'position',
            clientId: this.clientId,
            x: this.x,
            y: this.y
        })
    }
}