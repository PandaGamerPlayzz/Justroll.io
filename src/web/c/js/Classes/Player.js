const CHAT_TIME = 10;

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
        this.dx = 0;
        this.dy = 0;
        this.x = 0;
        this.y = 0;

        this.messages = [];

        this.color = color;
    }

    update(dt) {
        let now = Date.now();

        for(let i = 0; i < this.messages.length; i++) {
            let message = this.messages[i];

            if(now - message[1] > 1000 * CHAT_TIME) {
                this.messages.splice(i, 1);
                i--;
            }
        }

        this.x += this.dx;
        this.y += this.dy;

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

            if(isMovingLeftOrRight == false && this.rotation != 0) {
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

        // Render eg and hitbox

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

        // Render chat bubbles

        for(let i = this.messages.length - 1; i >= 0; i--) {
            let message = this.messages[i];
            let messageString = message[0];

            if(i === this.messages.length - 1) {
                let cx = x - 20;
                let cy = y - 25 - height / 2;

                ctx.save();
                ctx.translate(cx, cy);

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(40, 0);
                ctx.lineTo(20, 17);
                ctx.closePath();

                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fill();

                ctx.translate(-cx, -cy);
                ctx.restore();
            }

            ctx.font = '30px Arial';
            let text = ctx.measureText(messageString);

            ctx.beginPath();
            ctx.rect(x - 5 - (text.width / 2), y - (70 * (i + 1) - 15 * i) - height / 2, text.width + 10, 50);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fill();

            ctx.beginPath();
            ctx.font = '30px Arial';
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.textAlign = 'center';
            ctx.fillText(messageString, x, y - (70 * (i + 1) - 15 * i) - 15);
        }
    }

    incrementPosition(x, y) {
        this.x += x;
        this.y += y;

        this.sendPositionPacket();
    }

    sendMessage(messageString) {
        this.game.socket.emit('clientUpdate', {
            code: 'chat',
            clientId: this.clientId,
            messageString: messageString
        });

        this.receiveMessage(messageString);
    }

    receiveMessage(messageString) {
        this.messages.push([messageString, Date.now()]);
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