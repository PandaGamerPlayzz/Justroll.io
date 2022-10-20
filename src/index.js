const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const PORT = process.env.PORT || 5000;
const WEB_PATH = __dirname + (process.env.WEB_PATH || '/web/');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res, next) => {
    res.sendFile(WEB_PATH + 'index.html');
});

app.get('*', function(req, res, next) {
    var err = new Error();
    err.status = 404;
    next(err);
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

    console.log(console.log(`Server is running at port ${port}`));
});

io.on('connection', (socket) => {
    console.log('Client connected to the WebSocket');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('test', () => {
        socket.emit('test', 'Hello from the server!');
    });
});