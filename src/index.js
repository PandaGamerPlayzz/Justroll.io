const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const PORT = process.env.PORT || 5000;
const WEB_PATH = __dirname + (process.env.WEB_PATH || '/web/');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const EG_COLORS = ['Salmon', 'Cyan', 'Lime', 'Magenta', 'Purple', 'Blue', 'Yellow', 'Orange'];

const UPDATE_RATE = 1000 / 500;

let lastClientId = 0;
let clients = {};
let servers = {};

app.get('*', function(req, res, next) {
    try {
        res.sendFile(WEB_PATH + req.url.split('?')[0].substring(1));
    } catch (error) {
        var err = new Error();
        err.status = 404;
        next(err);
    }
});

app.use(function(err, req, res, next) {
    if(err.status === 404) {
        res.status(200).json({
            error: 404
        })
    } else {
        return next();
    }
});

http.listen(PORT, () => {
    var host = http.address().address;
    var port = http.address().port;

    console.log(`Server is running at port ${port}`);
});

const shuffleArray = (arr) => [...Array(arr.length)]
    .map((_, i) => Math.floor(Math.random() * (i + 1)))
    .reduce(
        (shuffled, r, i) =>
            shuffled.map((num, j) =>
            j === i ? shuffled[r] : j === r ? shuffled[i] : num
        ),
    arr
);

function randrange(min, max) {
    return Math.floor(Math.random() * max) + min;
}

function CreateServer(serverCode) {
    servers[serverCode] = {
        ownerClientId: null,
        serverCode: serverCode,
        eg_colors: JSON.parse(JSON.stringify(EG_COLORS)),
        clients: {}
    };

    return servers[serverCode];
}

function JoinServer(clientId, serverCode, clientData) {
    let server = servers[serverCode];

    server.eg_colors = shuffleArray(server.eg_colors);
    clientData.color = server.eg_colors.pop();

    server.clients[clientId] = {
        clientId: clientId,
        data: clientData
    };

    if(server.ownerClientId === null) server.ownerClientId = clientId;
    clients[clientId].currentServerCode = serverCode;

    FullUpdateAllSockets(serverCode);

    return server;
}

function LeaveServer(clientId) {
    let server = servers[clients[clientId].currentServerCode];

    if(server !== undefined) {
        if(EG_COLORS.includes(server.clients[clientId].data.color)) server.eg_colors.push(server.clients[clientId].data.color);
        delete server.clients[clientId];

        if(server.ownerClientId == clientId) {
            if(Object.keys(server.clients).length > 0) {
                server.ownerClientId = server.clients[Object.keys(server.clients)[0]].clientId;
            } else {
                for(let [redirectClientId, _] in Object.entries(server.clients)) {
                    let clientSocket = clients[redirectClientId].socket;
                    clientSocket.emit('redirect', '/play/menu/?s=ownerleft');
                }
    
                delete servers[clients[clientId].currentServerCode];
            }
        };
    }

    FullUpdateAllSockets(clients[clientId].currentServerCode);
}

function FullUpdateAllSockets(serverCode) {
    let server = servers[serverCode];

    if(server) {
        for(let [clientId, _] of Object.entries(server.clients)) {
            let client = clients[clientId];
            let clientSocket = client.socket;
    
            clientSocket.emit('serverUpdate', {
                code: 'full',
                server: server
            });
        }
    }
}

io.on('connection', (socket) => {
    const clientId = lastClientId;
    lastClientId += 1;

    let randomRGB = [randrange(0, 255), randrange(0, 255), randrange(0, 255)];
    let updateQueue = [];

    clients[clientId] = {
        socket: socket,
        currentServerCode: null
    };

    socket.emit('connectionMade', {
        clientId: clientId
    });

    socket.on('joinServer', (serverCode) => {
        if(!(serverCode in servers)) CreateServer(serverCode);
        socket.emit('serverJoined', JoinServer(clientId, serverCode, {
            randomRGB: randomRGB,
            x: 100,
            y: 100,
            rotation: 0
        }));
    });

    socket.on('clientUpdate', (data) => {
        let server = servers[clients[clientId].currentServerCode];

        if(server === undefined) return;
        if(server.clients[data.clientId] === undefined) return;

        switch(data.code) {
            case 'chat':
                updateQueue.push({
                    code: 'chat',
                    clientId: data.clientId,
                    messageString: data.messageString
                });

                break;
            case 'position':
                server.clients[data.clientId].data.x = data.x;
                server.clients[data.clientId].data.y = data.y;
                server.clients[data.clientId].data.rotation = data.rotation;

                for(let i = 0; i < updateQueue.length; i++) {
                    let update = updateQueue[i];

                    if(update && update.code === 'position' && update.clientId === data.clientId) updateQueue[i] = undefined;
                }

                updateQueue.push({
                    code: 'position',
                    clientId: data.clientId,
                    x: data.x,
                    y: data.y,
                    rotation: data.rotation
                });

                break;
        }
    });

    socket.on('disconnect', () => {
        if(clients[clientId].currentServerCode !== null) LeaveServer(clientId);

        delete clients[clientId];
    });

    function sendUpdates(i) {
        let updates = JSON.parse(JSON.stringify(updateQueue)).filter(function(x) {
            return x !== null && x !== undefined;
        });

        updateQueue = [];

        for(let i = 0; i < updates.length; i++) {
            socket.broadcast.emit('serverUpdate', updates[i]);
        }

        // if(updates.length > 0) console.log(i, updates);

        setTimeout(sendUpdates, UPDATE_RATE, i + 1);
    }

    sendUpdates(0);
});