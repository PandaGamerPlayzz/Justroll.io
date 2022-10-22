import { Player } from './Classes/Player.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let game;

class Game {
    constructor(width, height) {
        this.pressedKeys = [];
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.connections = {
            'onMouseMove': [],
            'onMouseUp': [],
            'onMouseDown': [],
            'onKeyDown': [],
            'onKeyUp': [],
            'onStep': []
        };

        this.resize(width, height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.draw();
    }

    update() {
        
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
        for (let element of game.connections['onMouseMove']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, game=game)
        }
    }

    onMouseDown(event, game=this) {
        for (let element of game.connections['onMouseDown']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, object=object)
        }
    }

    onMouseUp(event, game=this) {
        for (let element of game.connections['onMouseUp']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, object=object)
        }
    }

    onKeyDown(event, game=this) {
        for (let element of game.connections['onKeyDown']) {
            let func = element[0];
            let object = element[1];

            func(event, object=object)
        }
    }

    onKeyUp(event, game=this) {
        for (let element of game.connections['onKeyUp']) {
            let func = element[0];
            let object = element[1];

            func(event, object=object)
        }
    }

    onStep(timestamp, game=this) {
        for (let element of game.connections['onStep']) {
            let func = element[0];
            let object = element[1];

            func(timestamp, object=object)
        }

        game.update();
        game.draw(ctx);
    }

    connect(functionName, callback, object, game=this) {
        game.connections[functionName].push([callback, object]);
    }
}

function GenerateJoinCode() {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));

        if(i == 2) code += '-';
    }

    window.location.href += '?c=' + code;

    return code;
}

function Main() {
    var socket = io();
    var clientId;

    var joinCode = urlParams.get('c') || GenerateJoinCode();

    game = new Game(canvas.width, canvas.height);

    // Socket events

    socket.on('redirect', (url) => {
        window.location.href = url;
    });

    socket.on('serverJoined', (server) => {
        console.log(server);
    });

    socket.on('connectionMade', (res) => {
       clientId = res.clientId;

       socket.emit('joinServer', joinCode);
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