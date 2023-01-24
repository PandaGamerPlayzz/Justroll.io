import { getDrawValues } from './Utils.js';

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

let chatBar = new Image();
chatBar.src = '/c/img/svg/Gui/ChatBar/Bar.svg';

let airplaneUnselected = new Image();
airplaneUnselected.src = '/c/img/svg/Gui/ChatBar/AirplaneUnselected.svg';

let airplaneSelected = new Image();
airplaneSelected.src = '/c/img/svg/Gui/ChatBar/AirplaneSelected.svg';

class Game {
    constructor(socket, width, height) {
        // DEBUG PROPERTIES

        this.showHitboxes = false;
        this.showPoints = false;

        // PROPERTIES

        this.chatBarOpen = false;
        this.chatMessage = '';

        this.pressedKeys = [];
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.cameraX = 0;
        this.cameraY = 0;

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

        let hangingPixelsX = this.width - window.innerWidth;

        canvas.style.left = '50%';
        if(this.player && this.player.physicsObject && hangingPixelsX > 0) {
            let x = (this.player.physicsObject.x + this.player.physicsObject.sizeX * 0.5) / this.width * 100 % 100;
            let offset = (hangingPixelsX / 2);

            if(x < this.levelLoader.currentLevel.levelMin + 50) {
                canvas.style.left = `calc(50% + ${offset - (offset * (x % 50 / 50))}px)`;
            } else if(x > this.levelLoader.currentLevel.levelMax - 50) {
                canvas.style.left = `calc(50% - ${offset * (x % 50 / 50)}px)`;
            }
        }

        if(this.server !== null) {
            for(let [otherClientId, client] of Object.entries(this.server.clients)) {
                if(!(otherClientId in this.players)) {
                    let newPlayer = new Player(this, otherClientId, client.data.color);

                    newPlayer.physicsObject.x = client.data.x;
                    newPlayer.physicsObject.y = client.data.y;
                    newPlayer.physicsObject.rotation = client.data.rotation;

                    this.players[otherClientId] = newPlayer;
                    if(otherClientId == clientId) this.player = app.player = newPlayer;
                }
            }
        }

        this.levelLoader.update(dt);

        for(let [playerClientId, player] of Object.entries(this.players)) {
            player.update(dt);

            if(Object.keys(this.server.clients).includes(playerClientId.toString()) == false) {
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

            if(this.chatBarOpen) {
                ctx.beginPath();
                ctx.drawImage(chatBar, (this.width / 2) - (this.width / 1.9 / 2), this.height - (this.height / 48) - (this.height / 10.8), this.width / 1.9, this.height / 10.8);

                let airplane = this.chatMessage.replaceAll(' ', '') === '' ? airplaneUnselected : airplaneSelected;

                ctx.beginPath();
                ctx.drawImage(airplane, (this.width / 2) + (this.width / 1.9 / 2) - (this.height / 10.8) - 10, this.height - (this.height / 48) - (this.height / 10.8), this.height / 10.8, this.height / 10.8);
            
                let messageString = this.chatMessage === '' ? 'Type Here...' : this.chatMessage;

                ctx.beginPath();
                ctx.font = `${this.height / 24}px Arial`;
                ctx.fillStyle = this.chatMessage === '' ? 'rgba(30, 30, 30, 0.25)' : 'rgb(0, 0, 0)';
                ctx.textAlign = 'start';
                ctx.fillText(messageString, (this.width / 2) - (this.width / 1.9 / 2) + 15, this.height - (this.height / 48) - (this.height / 10.8 / 2) + (this.height / 24 / 4));
            }
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
        if(this.chatBarOpen) {
            if(event.key.length === 1) {
                this.chatMessage += event.key;
            } else if(event.code == 'Backspace') {
                this.chatMessage = this.chatMessage.slice(0, this.chatMessage.length - 1);
            }
        }

        if(event.code == 'Enter' && this.chatBarOpen) {
            this.chatBarOpen = false;

            if(this.chatMessage.replaceAll(' ', '') !== '') this.player.sendMessage(this.chatMessage);
            this.chatMessage = '';
        }

        if(event.code == 'Escape') {
            this.chatBarOpen = false;
            this.chatMessage = '';
        }

        if((event.code == 'Slash' || event.key == 't' || event.key == 'T') && !this.chatBarOpen) {
            this.chatBarOpen = true;
        }

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

    if(code == 'ANG-RVN') code = GenerateJoinCode();

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

function RickRoll() {
    let body = document.getElementsByTagName('body')[0];

    let iframe = document.createElement('iframe');
    iframe.id = 'rick';
    iframe.type = 'text/html';
    iframe.allowFullscreen = 'true';
    iframe.allow = 'autoplay;';
    iframe.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?mute=0&modestbranding=0&autoplay=1&autohide=1&rel=0&showinfo=0&controls=0&disablekb=1&enablejsapi=1&iv_load_policy=3&loop=1';

    iframe.style.position = 'absolute';
    iframe.style.zIndex = '1000';
    iframe.style.left = '0px';
    iframe.style.top = '0px';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';

    let div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '0px';
    div.style.top = '0px';
    div.style.width = '100vw';
    div.style.height = '100vh';
    div.style.zIndex = '1001';

    body.append(iframe, div);
}

function Main() {
    socket = io();
    joinCode = GetValidJoinCode();

    let hasRickRolled = false;

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
        if(joinCode == 'ANG-RVN' && hasRickRolled == false) {
            hasRickRolled = true;
            RickRoll();
        }

        game.mouseDown = true;
        RelayMouse(event, game.onMouseDown);
    });

    canvas.addEventListener('mouseup', (event) => {
        game.mouseDown = false;
        RelayMouse(event, game.onMouseUp);
    });

    window.addEventListener('keydown', (event) => {
        if(joinCode == 'ANG-RVN' && hasRickRolled == false) {
            hasRickRolled = true;
            RickRoll();
        }

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
    canvas.height = window.innerHeight;
    canvas.width = window.innerHeight * (16 / 9);

    // if(window.innerWidth > window.innerHeight) {
    //     canvas.height = window.innerHeight;
    //     canvas.width = window.innerHeight * (16 / 9);
    // } else {
    //     canvas.width = window.innerWidth;
    //     canvas.height = window.innerWidth * (9 / 16);
    // }

    if(game) game.resize(canvas.width, canvas.height);
}

CanvasResize();

$(window).bind('resize', CanvasResize);
$(Main);