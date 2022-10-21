const KEYBOARD_KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ';

export class MenuScreen {
    constructor(game) {
        this.game = game;
        this.boxFocused = false;
        this.boxText = '';
    }

    update() {

    }

    draw(ctx) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.strokeRect(75, canvas.height - 125, canvas.width - 300, 50);

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.strokeRect(canvas.width - 200, canvas.height - 125, 125, 50);

        ctx.beginPath();
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillText('CREATE', canvas.width - 137.5, canvas.height - 92.5);

        ctx.beginPath();
        let boxText = '';

        if (this.boxText == '' && this.boxFocused == false) {
            ctx.font = 'italic 20px Arial';
            boxText = 'Lobby name...';
        } else {
            ctx.font = '20px Arial';
            boxText = this.boxText;
        }

        if(this.boxFocused == true && Math.round(new Date() / 1000 * 1.75) % 2 == 0) boxText += '|';

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillText(boxText, 87.5, canvas.height - 92.5);
    }

    focusBox(mouseX, mouseY) {
        this.boxFocused = (mouseX > 75 && mouseX < canvas.width - 300) && (mouseY > canvas.height - 125 && mouseY < canvas.height - 75);
    }
    
    receiveKeyboardFeed(key) {
        if(this.boxFocused !== true) return;

        if (KEYBOARD_KEYS.includes(key)) {
            this.boxText += key
        } else if (key == 'Backspace') {
            this.boxText = this.boxText.slice(0, -1);
        }
    }
}