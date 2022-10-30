const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const PORT = process.env.PORT || 5000;
const WEB_PATH = __dirname + (process.env.WEB_PATH || '/web/');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const eg_colors = ['Salmon', 'Cyan', 'Lime', 'Magenta', 'Purple', 'Blue', 'Yellow', 'Orange'];

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

function randrange(min, max) {
    return Math.floor(Math.random() * max) + min;
}

function CreateServer(serverCode) {
    servers[serverCode] = {
        ownerClientId: null,
        serverCode: serverCode,
        eg_colors: eg_colors,
        clients: {}
    };

    return servers[serverCode];
}

function JoinServer(clientId, serverCode, clientData) {
    let server = servers[serverCode];

    clientData.color = server.eg_colors[Math.floor(Math.random() * eg_colors.length)];
    server.eg_colors.splice(server.eg_colors.indexOf(clientData.color), 1);

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
        server.eg_colors.push(server.clients[clientId].data.color);
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
            y: 100
        }));
    });

    socket.on('clientUpdate', (data) => {
        let server = servers[clients[clientId].currentServerCode];

        if(server == undefined) return;

        switch(data.code) {
            case 'position':
                server.clients[data.clientId].data.x = data.x;
                server.clients[data.clientId].data.y = data.y;

                socket.broadcast.emit('serverUpdate', {
                    code: 'position',
                    clientId: data.clientId,
                    x: data.x,
                    y: data.y
                });

                break;
        }
    });

    socket.on('disconnect', () => {
        if(clients[clientId].currentServerCode !== null) LeaveServer(clientId);

        delete clients[clientId];
    });
});