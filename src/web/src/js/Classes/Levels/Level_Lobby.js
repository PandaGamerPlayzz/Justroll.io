import { Level } from './Level.js';

let lobbyBackground = new Image();
lobbyBackground.src = '/src/img/svg/Levels/Lobby/Lobby_Background.svg';

let lobbyForeground = new Image();
lobbyForeground.src = '/src/img/svg/Levels/Lobby/Lobby_Foreground.svg';

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