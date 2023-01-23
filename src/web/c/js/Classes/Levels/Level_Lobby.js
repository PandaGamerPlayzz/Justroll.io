import { Level } from './Level.js';
import { RectPhysicsObject } from '../PhysicsObject.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let lobbyBackground = new Image();
lobbyBackground.src = '/c/img/svg/Levels/Lobby/Lobby_Background.svg';

let lobbyForeground = new Image();
lobbyForeground.src = '/c/img/svg/Levels/Lobby/Lobby_Foreground.svg';

export class Level_Lobby extends Level {
    constructor(game) {
        super(game);

        this.floorRect = new RectPhysicsObject(game, game.width, this.game.height * (250 / 1080));
        this.floorRect.friction = 0.3;
        this.floorRect.elasticity = 0.3;
        this.floorRect.x = 0;
        this.floorRect.y = this.game.height - this.game.height * (250 / 1080);
        this.floorRect.rotation = 0;
        this.floorRect.collisionType = 'floor';
        this.physicsObjects.push(this.floorRect);

        this.leftRect = new RectPhysicsObject(game, 100, this.game.height * (250 / 1080));
        this.leftRect.friction = 0.3;
        this.leftRect.elasticity = 0.5;
        this.leftRect.x = -100;
        this.leftRect.y = 0;
        this.leftRect.rotation = 0;
        this.leftRect.collisionType = 'wall';
        this.physicsObjects.push(this.leftRect);

        this.rightRect = new RectPhysicsObject(game, 100, this.game.height);
        this.rightRect.friction = 0.3;
        this.rightRect.elasticity = 0.5;
        this.rightRect.x = this.game.width;
        this.rightRect.y = 0;
        this.rightRect.rotation = 0;
        this.rightRect.collisionType = 'wall';
        this.physicsObjects.push(this.rightRect);

        this.joinCode = urlParams.get('c');
    }

    update(dt) {
        this.floorRect.x = 0;
        this.floorRect.y = this.game.height - this.game.height * (250 / 1080);
        this.floorRect.sizeX = this.game.width;
        this.floorRect.sizeY = this.game.height * (250 / 1080);
        this.floorRect.rotation = 0;

        this.leftRect.x = -100;
        this.leftRect.y = 0;
        this.leftRect.sizeX = 100;
        this.leftRect.sizeY = this.game.height;
        this.leftRect.rotation = 0;

        this.rightRect.x = this.game.width;
        this.rightRect.y = 0;
        this.rightRect.sizeX = 100;
        this.rightRect.sizeY = this.game.height;
        this.rightRect.rotation = 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.drawImage(lobbyBackground, 0, 0, this.game.width, this.game.height);

        ctx.beginPath();
        ctx.drawImage(lobbyForeground, 0, 0, this.game.width, this.game.height);
    }

    drawOnTop(ctx) {
        ctx.beginPath();
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgb(119, 0, 179)';
        ctx.strokeText(this.joinCode, this.game.width / 2, this.game.height - this.game.height / 11);
        ctx.fillStyle = 'rgb(170, 0, 255)';
        ctx.fillText(this.joinCode, this.game.width / 2, this.game.height - this.game.height / 11);
    }
}