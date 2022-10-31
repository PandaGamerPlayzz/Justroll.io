import { Level } from './Level.js';

let elements = document.getElementById('elements');

let lobbyBackground = new Image();
lobbyBackground.src = '/c/img/svg/Levels/Lobby/Lobby_Background.svg';
elements.appendChild(lobbyBackground);

let lobbyForeground = new Image();
lobbyForeground.src = '/c/img/svg/Levels/Lobby/Lobby_Foreground.svg';
elements.appendChild(lobbyForeground);

export class Level_Lobby extends Level {
    constructor(game) {
        super(game);
    }

    update(dt) {

    }

    draw(ctx) {
        ctx.beginPath();
        ctx.drawImage(lobbyBackground, 0, 0, this.game.width, this.game.height);

        ctx.beginPath();
        ctx.drawImage(lobbyForeground, 0, 0, this.game.width, this.game.height);
    }
}