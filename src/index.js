const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const PORT = process.env.PORT || 5000;
const WEB_PATH = __dirname + (process.env.WEB_PATH || '/web/');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
    if (err.status === 404) {
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

function CreateServer(socket, clientId, serverCode) {
    servers[serverCode] = {
        ownerClientId: null,
        serverCode: serverCode,
        clients: {}
    };

    return servers[serverCode];
}

function JoinServer(socket, clientId, serverCode) {
    server = servers[serverCode];

    server.clients[clientId] = {
        clientId: clientId
    };

    if(server.ownerClientId === null) server.ownerClientId = clientId;
    clients[clientId].currentServerCode = serverCode;

    return server;
}

io.on('connection', (socket) => {
    const clientId = lastClientId;
    lastClientId += 1;

    clients[clientId] = {
        socket: socket,
        currentServerCode: null
    };

    socket.emit('connectionMade', {
        clientId: clientId
    });

    socket.on('joinServer', (serverCode) => {
        if(!(serverCode in servers)) CreateServer(socket, clientId, serverCode);
        socket.emit('serverJoined', JoinServer(socket, clientId, serverCode));

        console.log(servers);
    });

    socket.on('disconnect', () => {
        if (clients[clientId].currentServerCode !== null) {
            let server = servers[clients[clientId].currentServerCode];

            if(server !== undefined) {
                delete server.clients[clientId];
                if(server.ownerClientId == clientId) {
                    for (let [ redirectClientId, _ ] in server.clients) {
                        clientSocket = clients[redirectClientId].socket;
                        clientSocket.emit('redirect', '/play/menu/?s=ownerleft');
                    }

                    delete servers[clients[clientId].currentServerCode]
                };
            }

            console.log(servers);
        }

        delete clients[clientId];
    });
});