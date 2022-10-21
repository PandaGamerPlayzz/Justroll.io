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
        res.sendFile(WEB_PATH + req.url.substring(1));
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

function CreateServer(socket, clientId, serverName) {
    servers[serverName] = {
        ownerClientId: clientId,
        serverName: serverName,
        clients: {}
    };

    return servers[serverName];
}

io.on('connection', (socket) => {
    const clientId = lastClientId;
    lastClientId += 1;

    clients[clientId] = socket;

    socket.emit('connectionMade', {
        clientId: clientId
    });

    socket.on('createServer', (serverName) => {
        CreateServer(socket, clientId, serverName)
    });

    socket.on('disconnect', () => {
        delete clients[clientId]
    });
});