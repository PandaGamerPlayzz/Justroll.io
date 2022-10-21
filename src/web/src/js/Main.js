import { MenuScreen } from './Classes/Menu/MenuScreen.js';
import { Player } from './Classes/Player.js';

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let game;

class Game {
    constructor(width, height) {
        this.menuScreen = new MenuScreen(game);
        this.pressedKeys = [];
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.resize(width, height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.draw();
    }

    update() {
        if(this.menuScreen) this.menuScreen.update();
    }

    draw(ctx) {
        if (ctx) {
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fill();

            if(this.menuScreen) this.menuScreen.draw(ctx);
        }
    }

    onMouseMove(event, game=this) {
        
    }

    onMouseDown(event, game=this) {
        
    }

    onMouseUp(event, game=this) {
        if(game.menuScreen) game.menuScreen.focusBox(game.mouseX, game.mouseY);
    }

    onKeyDown(event, game=this) {
        if(game.menuScreen) game.menuScreen.receiveKeyboardFeed(event.key);
    }

    onKeyUp(event, game=this) {
        
    }

    onStep(timestamp, game=this) {
        game.update();
        game.draw(ctx);
    }
}

function Main() {
    var socket = io();
    var clientId;

    game = new Game(canvas.width, canvas.height);

    // Socket events

    socket.on('connectionMade', (res) => {
       clientId = res.clientId;
    }); 

    // Listener events

    function RelayMouse(event, func) {
        game.mouseX = event.pageX;
        game.mouseY = event.pageY;

        if(func) func(event, game=game);
    }

    canvas.addEventListener('mousemove', (event) => RelayMouse(event, game.onMouseMove));

    canvas.addEventListener('mousedown', (event) => {
        game.mouseDown = true;
        RelayMouse(event, game.onMouseDown);
    });

    canvas.addEventListener('mouseup', (event) => {
        game.mouseDown = false;
        RelayMouse(event, game.onMouseUp);
    });

    window.addEventListener('keydown', (event) => {
        if(!game.pressedKeys.includes(event.key)) game.pressedKeys.push(event.key);

        game.onKeyDown(event, game=game);
    });

    window.addEventListener('keyup', (event) => {
        game.pressedKeys = game.pressedKeys.filter((x) => {
            return x !== event.key;
        });

        game.onKeyUp(event, game=game);
    });

    function step(timestamp) {
        game.onStep(timestamp, game=game);
        window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
}

function GetMousePos(event) {
    let rect = canvas.getBoundingClientRect();
    let mousePos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    if (game) {
        game.mouseX = mousePos.x;
        game.mouseY = mousePos.y;
    }

    return mousePos;
}

function CanvasResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if(game) game.resize(game, canvas.width, canvas.height);
}

CanvasResize();

$(window).bind('resize', CanvasResize);
$(Main);