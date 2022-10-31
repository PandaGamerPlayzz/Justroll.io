let elements = document.getElementById('elements');

function getEgImages() {
    let path = '/c/img/svg/Eg/';
    let img_names = ['Eg_White.svg', 'Eg_Salmon.svg', 'Eg_Cyan.svg', 'Eg_Lime.svg', 'Eg_Magenta.svg', 'Eg_Purple.svg', 'Eg_Blue.svg', 'Eg_Yellow.svg', 'Eg_Orange.svg'];
    let eg_imgs = {};

    for(let i = 0; i < img_names.length; i++) {
        eg_imgs[img_names[i]] = new Image();
        eg_imgs[img_names[i]].src = path + img_names[i];

        elements.appendChild(eg_imgs[img_names[i]]);
    }

    return eg_imgs;
}

let eg_imgs = getEgImages();

let speed = 35;

export class Player {
    constructor(game, clientId, color='White') {
        this.game = game;

        this.eg_img = eg_imgs[`Eg_${color}.svg`].cloneNode(true);
        
        this.clientId = clientId;
        this.x = 0;
        this.y = 0;

        this.color = color;
    }

    update(dt) {
        if(this.game.isAnyKeyDown('w', 'W')) {
            this.incrementPosition(0, -speed * dt);
        }

        if(this.game.isAnyKeyDown('a', 'A')) {
            this.incrementPosition(-speed * dt, 0);
        }

        if(this.game.isAnyKeyDown('s', 'S')) {
            this.incrementPosition(0, speed * dt);
        }
    
        if(this.game.isAnyKeyDown('d', 'D')) {
            this.incrementPosition(speed * dt, 0);
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.drawImage(this.eg_img, this.x, this.y, 118 * 0.65, 150 * 0.65);
    }

    incrementPosition(x, y) {
        this.x += x;
        this.y += y;

        this.game.socket.emit('clientUpdate', {
            code: 'position',
            clientId: this.clientId,
            x: this.x,
            y: this.y
        });
    }
}