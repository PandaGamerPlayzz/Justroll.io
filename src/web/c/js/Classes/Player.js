import { EllipsePhysicsObject, collides } from './PhysicsObject.js';

const UPDATE_RATE = 1000 / 100;
const CHAT_TIME = 10;

const SPEED = 32.5;
const ROTATION_SPEED = 32.5;
const ACCELERATION = 0.2;
const JUMP_POWER = 50;

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

export class Player {
    constructor(game, clientId, color='White') {
        this.game = game;

        this.eg_img = eg_imgs[`Eg_${color}.svg`].cloneNode(true);

        this.physicsObject = new EllipsePhysicsObject(this.game, 118 * 0.65, 150 * 0.65);
        this.physicsObject.elasticity = 0.4;
        this.physicsObject.friction = 0;
        this.physicsObject.hasGravity = true;

        this.canJump = false;
        this.movementKeyDown = false;
        this.lastCollision = Date.now();
        this.wallCollision = null;
        
        this.clientId = clientId;
        
        this.lastUpdate = null;
        this.lastPositionUpdate = null;
        this.updateQueue = [];
        this.messages = [];

        this.color = color;
    }

    update(dt) {
        let now = Date.now();

        this.physicsObject.dr = this.physicsObject.dx;
        this.physicsObject.update(dt);

        // Check for player collisions
        for(let i = 0; i < Object.values(this.game.players).length; i++) {
            let player = Object.values(this.game.players)[i];

            if(player === this) continue;

            let collision = collides(this.physicsObject, player.physicsObject);

            if(collision) {
                if(!this.movementKeyDown) this.physicsObject.dx = 0.55 * ((this.physicsObject.x + this.physicsObject.a) - (player.physicsObject.x + player.physicsObject.a));
                this.physicsObject.dy = 0.55 * ((this.physicsObject.y + this.physicsObject.b) - (player.physicsObject.y + player.physicsObject.b));

                this.physicsObject.dr = this.physicsObject.dx >= 0 ? 30 : -30;

                while(collides(this.physicsObject, player.physicsObject)) {
                    this.physicsObject.x += 0.05 * ((this.physicsObject.x + this.physicsObject.a) - (player.physicsObject.x + player.physicsObject.a));
                    this.physicsObject.y += 0.05 * ((this.physicsObject.y + this.physicsObject.b) - (player.physicsObject.y + player.physicsObject.b));
                }
            }
        }

        // Check for level collisions
        this.wallCollision = null;
        for(let i = 0; i < this.game.levelLoader.currentLevel.physicsObjects.length; i++) {
            let levelObject = this.game.levelLoader.currentLevel.physicsObjects[i];

            let collision = collides(this.physicsObject, levelObject);
            
            let averageFriction = (this.physicsObject.friction + levelObject.friction) / 2;
            let averageElasticity = (this.physicsObject.elasticity + levelObject.elasticity) / 2;

            if(collision) {
                if(levelObject.collisionType == 'floor') {
                    this.canJump = true;
                    this.lastCollision = Date.now();

                    if(!this.movementKeyDown) {
                        let accelerationDueToFriction = -this.physicsObject.dx * averageFriction;

                        this.physicsObject.dx = accelerationDueToFriction * dt + this.physicsObject.dx;
                        this.physicsObject.dr = accelerationDueToFriction * dt + this.physicsObject.dr;
                    
                        let minDelta = 0.5;

                        if(-minDelta <= this.physicsObject.dx && this.physicsObject.dx <= minDelta) this.physicsObject.dx = 0
                        if(-minDelta <= this.physicsObject.dr && this.physicsObject.dr <= minDelta) this.physicsObject.dr = 0
                    }

                    while(collides(this.physicsObject, levelObject)) {
                        this.physicsObject.y -= 0.05;
                    }

                    this.physicsObject.dy = -Math.abs(this.physicsObject.dy) * averageElasticity;
                } else if(levelObject.collisionType == 'wall') {
                    let direction = levelObject.x < this.physicsObject.x ? -1 : 1;
                    this.wallCollision = levelObject;

                    while(collides(this.physicsObject, levelObject)) {
                        this.physicsObject.x -= 0.05 * direction;
                    }

                    if(!this.movementKeyDown) {
                        this.physicsObject.dx = -this.physicsObject.dx * averageElasticity;
                        this.physicsObject.dr = -this.physicsObject.dr * averageElasticity;
                    } else {
                        this.physicsObject.dx = 0;
                        this.physicsObject.dr = 0;
                    }
                }
            }
        }

        for(let i = 0; i < this.messages.length; i++) {
            let message = this.messages[i];

            if(now - message[1] > 1000 * CHAT_TIME) {
                this.messages.splice(i, 1);
                i--;
            }
        }

        this.movementKeyDown = false;
        if(this.game.clientId == this.clientId && !this.game.chatBarOpen) {
            // Jump
            if(this.canJump === true && Date.now() - this.lastCollision < 250 && this.game.isAnyKeyDown('w', 'W', ' ', 'ArrowUp')) {
                this.movementKeyDown = true;
                this.canJump = false;
                this.physicsObject.dy = -JUMP_POWER;
            }

            let direction = 0;
            if(this.wallCollision !== null) direction = this.wallCollision.x < this.physicsObject.x ? -1 : 1;
            
            // Left
            if(this.game.isAnyKeyDown('a', 'A', 'ArrowLeft') && !this.game.isAnyKeyDown('d', 'D', 'ArrowRight')) {
                this.movementKeyDown = true;
                
                if(this.physicsObject.dr > -ROTATION_SPEED) this.physicsObject.dr += -ROTATION_SPEED * ACCELERATION * dt;
                // if(this.physicsObject.dr < -ROTATION_SPEED) this.physicsObject.dr = -ROTATION_SPEED;

                if(this.physicsObject.dx > -SPEED) this.physicsObject.dx += -SPEED * ACCELERATION * dt;
                // if(this.physicsObject.dx < -SPEED) this.physicsObject.dx = -SPEED;
            }
        
            // Right
            if(this.game.isAnyKeyDown('d', 'D', 'ArrowRight') && !this.game.isAnyKeyDown('a', 'A', 'ArrowLeft')) {
                this.movementKeyDown = true;
                
                if(this.physicsObject.dr < ROTATION_SPEED) this.physicsObject.dr += ROTATION_SPEED * ACCELERATION * dt;
                // if(this.physicsObject.dr > ROTATION_SPEED) this.physicsObject.dr = ROTATION_SPEED;
                
                if(this.physicsObject.dx < SPEED) this.physicsObject.dx += SPEED * ACCELERATION * dt;
                // if(this.physicsObject.dx > SPEED) this.physicsObject.dx = SPEED;
            }
        }

        this.queuePositionPacket();

        if(this.lastUpdate === null || Date.now() - this.lastUpdate > UPDATE_RATE) this.sendUpdates();
    }

    draw(ctx) {
        let rotationInRadians = this.physicsObject.rotation * Math.PI / 180;
        let width = this.physicsObject.sizeX;
        let height = this.physicsObject.sizeY;
        let x = this.physicsObject.x + width * 0.5;
        let y = this.physicsObject.y + height * 0.5

        // Render eg

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationInRadians);

        ctx.beginPath();
        ctx.drawImage(this.eg_img, -width / 2, -height / 2, width, height);

        ctx.rotate(-rotationInRadians);
        ctx.translate(-x, -y);
        ctx.restore();

        if(this.game.showHitboxes) this.physicsObject.drawHitbox(ctx);

        // Render chat bubbles

        for(let i = 0; i < this.messages.length; i++) {
            let message = this.messages.slice().reverse()[i];
            let messageString = message[0];

            if(i === 0) {
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

            let rectWidth = text.width > 40 ? text.width : 40;

            ctx.beginPath();
            ctx.rect(x - 5 - (rectWidth / 2), y - (70 * (i + 1) - 15 * i) - height / 2, rectWidth + 10, 50);
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
        this.physicsObject.x += x;
        this.physicsObject.y += y;

        this.queuePositionPacket();
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
        this.messages[this.messages.length] = [messageString, Date.now()];
    }

    queuePositionPacket() {
        if(this !== this.game.player) return;
        if(this.lastPositionUpdate !== null && this.physicsObject.x == this.lastPositionUpdate.x && this.physicsObject.y == this.lastPositionUpdate.y && this.physicsObject.rotation == this.lastPositionUpdate.rotation) return;

        for(let i = 0; i < this.updateQueue.length; i++) {
            let update = this.updateQueue[i];

            if(update && update.code === 'position') this.updateQueue[i] = undefined;
        }

        this.lastPositionUpdate = {
            code: 'position',
            clientId: this.clientId,
            x: this.physicsObject.x,
            y: this.physicsObject.y,
            rotation: this.physicsObject.rotation,
            dx: this.physicsObject.dx,
            dy: this.physicsObject.dy,
            dr: this.physicsObject.dr
        };

        this.updateQueue.push(this.lastPositionUpdate);
    }

    sendUpdates() {
        let updates = JSON.parse(JSON.stringify(this.updateQueue)).filter(function(x) {
            return x !== null && x !== undefined;
        });

        this.updateQueue = [];

        for(let i = 0; i < updates.length; i++) {
            this.game.socket.emit('clientUpdate', updates[i]);
        }

        this.lastUpdate = Date.now();
    }
}