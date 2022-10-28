let eg_img = new Image();
eg_img.src = '/src/img/svg/Eg/Eg.svg';

function getEgImages() {
    let path = '/src/img/svg/Eg/';
    let img_names = ['Eg_White.svg', 'Eg_Salmon.svg'];
    let eg_imgs = {};

    for(let i = 0; i < img_names.length; i++) {
        eg_imgs[img_names[i]] = new Image();
        eg_imgs[img_names[i]].src = path + img_names[i];
    }

    return eg_imgs;
}

let eg_imgs = getEgImages();

export class Player {
    constructor(game, clientId, color='White') {
        this.game = game;

        this.eg_img = eg_imgs[`Eg_${color}.svg`].cloneNode(true);
        
        this.clientId = clientId;
        this.x = 0;
        this.y = 0;

        this.color = color;
    }

    update() {

    }

    draw(ctx) {
        ctx.beginPath();
        ctx.drawImage(this.eg_img, this.x, this.y, 118 * 0.5, 150 * 0.5);

        // ctx.rect(this.x, this.y, 35, 35);
        // ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        // ctx.fill();
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