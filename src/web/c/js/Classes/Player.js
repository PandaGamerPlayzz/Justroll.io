function getEgImages() {
    let path = '/c/img/svg/Eg/';
    let img_names = ['Eg_White.svg', 'Eg_Salmon.svg', 'Eg_Cyan.svg', 'Eg_Lime.svg', 'Eg_Magenta.svg', 'Eg_Purple.svg', 'Eg_Blue.svg', 'Eg_Yellow.svg', 'Eg_Orange.svg'];
    let eg_imgs = {};

    for(let i = 0; i < img_names.length; i++) {
        eg_imgs[img_names[i]] = new Image();
        eg_imgs[img_names[i]].src = path + img_names[i];
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
        this.sizeX = 118 * 0.65;
        this.sizeY = 150 * 0.65;
        this.rotation = 0;
        this.x = 0;
        this.y = 0;

        this.color = color;
    }

    update(dt) {
        if(this.game.clientId == this.clientId) {
            let isMovingLeftOrRight = false;

            // Up
            if(this.game.isAnyKeyDown('w', 'W', 'ArrowUp') && !this.game.isAnyKeyDown('s', 'S', 'ArrowDown')) {
                this.incrementPosition(0, -speed * dt);
            }
    
            // Left
            if(this.game.isAnyKeyDown('a', 'A', 'ArrowLeft') && !this.game.isAnyKeyDown('d', 'D', 'ArrowRight')) {
                this.rotation -= 45 * dt;
                this.incrementPosition(-speed * dt, 0);
                isMovingLeftOrRight = true;
            }
    
            // Down
            if(this.game.isAnyKeyDown('s', 'S', 'ArrowDown') && !this.game.isAnyKeyDown('w', 'W', 'ArrowUp')) {
                this.incrementPosition(0, speed * dt);
            }
        
            // Right
            if(this.game.isAnyKeyDown('d', 'D', 'ArrowRight') && !this.game.isAnyKeyDown('a', 'A', 'ArrowLeft')) {
                this.rotation += 45 * dt;
                this.incrementPosition(speed * dt, 0);
                isMovingLeftOrRight = true;
            }

            if(isMovingLeftOrRight == false) {
                this.rotation = 0;
                this.sendPositionPacket();
            }
        }
    }

    draw(ctx) {
        let rotationInRadians = this.rotation * Math.PI / 180;
        let x = this.x + this.sizeX * 0.5;
        let y = this.y + this.sizeY * 0.5
        let width = this.sizeX;
        let height = this.sizeY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationInRadians);

        ctx.beginPath();
        ctx.drawImage(this.eg_img, -width / 2, -height / 2, width, height);

        ctx.rotate(-rotationInRadians);
        ctx.translate(-x, -y);
        ctx.restore();

        if(this.game.showHitboxes) {
            ctx.beginPath();
            ctx.ellipse(x, y, this.sizeX * 0.5, this.sizeY * 0.5, rotationInRadians, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fill();
        }
    }

    incrementPosition(x, y) {
        this.x += x;
        this.y += y;

        this.sendPositionPacket();
    }

    sendPositionPacket() {
        this.game.socket.emit('clientUpdate', {
            code: 'position',
            clientId: this.clientId,
            x: this.x,
            y: this.y,
            rotation: this.rotation
        });
    }
}