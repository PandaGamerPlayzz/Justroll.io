import { UDim2 } from '../UI/UDim2.js';

export class UIButton {
    constructor(game, text, position, size, textOffset=new UDim2(0, 0, 0, 0), fillBG='black', fillFG='white', fontSize=10, font='Arial', onClick=(mouseX, mouseY) => {}) {
        this.game = game;

        this.text = text;
        this.position = position;
        this.size = size;
        this.textOffset = textOffset;
        this.fillBG = fillBG;
        this.fillFG = fillFG;
        this.fontSize = fontSize;
        this.font = font;

        this.onClick = onClick;

        game.connect('onMouseUp', this.onMouseUp, this, game=game);
    }

    update() {

    }

    draw(ctx) {
        let [ posX, posY ] = this.position.getAbsoluteValues();
        let [ sizeX, sizeY ] = this.size.getAbsoluteValues();
        let [ textOffsetX, textOffsetY ] = this.textOffset.getAbsoluteValues();

        ctx.beginPath();
        ctx.fillStyle = this.fillBG;
        ctx.rect(posX, posY, sizeX, sizeY);
        ctx.fill();

        ctx.beginPath();
        ctx.font = (this.fontSize * canvas.width / 500).toString() + 'px ' + this.font;
        ctx.fillStyle = this.fillFG;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, posX + sizeX / 2 + textOffsetX, posY + sizeY / 2 + textOffsetY);
    }

    onMouseUp(mouseX, mouseY, button=this) {
        let [ posX, posY ] = button.position.getAbsoluteValues();
        let [ sizeX, sizeY ] = button.size.getAbsoluteValues();

        if(mouseX > posX && mouseX < posX + sizeX && mouseY > posY && mouseY < posY + sizeY) button.onClick(mouseX, mouseY);
    }
}