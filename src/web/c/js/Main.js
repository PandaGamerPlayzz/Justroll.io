import { Player } from './Classes/Player.js';

import { LevelLoader } from './Classes/Levels/Level.js';
import { Level_Lobby } from './Classes/Levels/Level_Lobby.js';

const DOM_URL = window.URL || window.webkitURL || window;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

var game;
var socket;
var clientId;
var joinCode;

class Game {
    constructor(socket, width, height) {
        // DEBUG PROPERTIES

        this.showHitboxes = false;
        this.showPoints = false;

        // PROPERTIES

        this.pressedKeys = [];
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.lastTimestamp = 0;

        this.socket = socket;
        this.server = null;
        this.players = {};
        this.player = null;

        this.connections = {
            'onMouseMove': [],
            'onMouseUp': [],
            'onMouseDown': [],
            'onKeyDown': [],
            'onKeyUp': [],
            'onStep': []
        };

        this.levelLoader = new LevelLoader(this, Level_Lobby);

        this.resize(width, height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.draw();
    }

    update(dt) {
        if(dt > 1) return;

        if(this.server !== null) {
            for(let [otherClientId, client] of Object.entries(this.server.clients)) {
                if(!(otherClientId in this.players)) {
                    let newPlayer = new Player(this, otherClientId, client.data.color);

                    newPlayer.physicsObject.x = client.data.x;
                    newPlayer.physicsObject.y = client.data.y;
                    newPlayer.physicsObject.rotation = client.data.rotation;

                    this.players[otherClientId] = newPlayer;
                    if(otherClientId == clientId) this.player = app.player = newPlayer;

                    console.log('Player Joined:', newPlayer);
                }
            }
        }

        this.levelLoader.update(dt);

        for(let [playerClientId, player] of Object.entries(this.players)) {
            player.update(dt);

            if(Object.keys(this.server.clients).includes(playerClientId.toString()) == false) {
                console.log('Player Disconnected:', this.players[playerClientId]);
                delete this.players[playerClientId];
            }
        }
    }

    draw(ctx) {
        if(ctx) {
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fill();

            this.levelLoader.draw(ctx);

            for(let [_, player] of Object.entries(this.players)) {
                player.draw(ctx);
            }

            this.levelLoader.drawOnTop(ctx);
        }
    }

    isAnyKeyDown(...keys) {
        for(let i = 0; i < keys.length; i++) {
            if(this.pressedKeys.includes(keys[i])) return true;
        }

        return false;
    }

    onMouseMove(event, game=this) {
        for(let element of game.connections['onMouseMove']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, game=game);
        }
    }

    onMouseDown(event, game=this) {
        for(let element of game.connections['onMouseDown']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, object=object);
        }
    }

    onMouseUp(event, game=this) {
        for(let element of game.connections['onMouseUp']) {
            let func = element[0];
            let object = element[1];

            func(game.mouseX, game.mouseY, object=object);
        }
    }

    onKeyDown(event, game=this) {
        for(let element of game.connections['onKeyDown']) {
            let func = element[0];
            let object = element[1];

            func(event, object=object);
        }
    }

    onKeyUp(event, game=this) {
        for(let element of game.connections['onKeyUp']) {
            let func = element[0];
            let object = element[1];

            func(event, object=object);
        }
    }

    onStep(timestamp, game=this) {
        let dt = (timestamp - this.lastTimestamp) / 100;

        for(let element of game.connections['onStep']) {
            let func = element[0];
            let object = element[1];

            func(timestamp, object=object);
        }

        game.update(dt);
        game.draw(ctx);

        this.lastTimestamp = timestamp;
    }

    connect(functionName, callback, object, game=this) {
        game.connections[functionName].push([callback, object]);
    }
}

function GenerateJoinCode() {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    for(let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));

        if(i == 2) code += '-';
    }

    window.location.href = window.location.href.split('?')[0] + '?c=' + code;

    return code;
}

function GetValidJoinCode() {
    let joinCode = urlParams.get('c') || GenerateJoinCode();

    let validLength = joinCode.length === 7;
    let hasDash = joinCode[3] === '-';
    let hasValidCharacters = joinCode.match(/[A-Z-]+/g)[0] === joinCode;

    if(!validLength || !hasDash || !hasValidCharacters) joinCode = GenerateJoinCode();

    return joinCode
}

function Main() {
    socket = io();
    joinCode = GetValidJoinCode();

    game = app.game = new Game(socket, canvas.width, canvas.height);

    // Socket events

    socket.on('redirect', (url) => {
        window.location.href = url;
    });

    socket.on('serverJoined', (server) => {
        game.server = server;
    });

    socket.on('serverUpdate', (data) => {
        switch(data.code) {
            case 'full':
                game.server = data.server;

                break;
            case 'chat':
                game.players[data.clientId].receiveMessage(data.messageString);

                break;
            case 'position':
                let client = game.server.clients[data.clientId];

                client.data.x = game.players[data.clientId].physicsObject.x = data.x;
                client.data.y = game.players[data.clientId].physicsObject.y = data.y;
                client.data.rotation = game.players[data.clientId].physicsObject.rotation = data.rotation;
                client.data.dx = game.players[data.clientId].physicsObject.dx = data.dx;
                client.data.dy = game.players[data.clientId].physicsObject.dy = data.dy;
                client.data.dr = game.players[data.clientId].physicsObject.dr = data.dr;

                break;
        }
    });

    socket.on('connectionMade', (data) => {
       clientId = data.clientId;
       game.clientId = clientId;

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

    if(game) {
        game.mouseX = mousePos.x;
        game.mouseY = mousePos.y;
    }

    return mousePos;
}

function CanvasResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if(game) game.resize(canvas.width, canvas.height);
}

CanvasResize();

$(window).bind('resize', CanvasResize);
$(Main);