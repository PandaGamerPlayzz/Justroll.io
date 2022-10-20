const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const PORT = process.env.PORT || 5000;
const WEB_PATH = __dirname + (process.env.WEB_PATH || '/web/')

const app = express();

app.get('/', (req, res, next) => {
    res.sendFile(WEB_PATH + 'index.html')
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

app.listen(PORT, () => console.log(`Server is running port ${PORT}`));

// app.get('/endpoint-1', (req, res, next) => {
//   res.status(200).json({
//     success: true,
//     data: {
//       message: 'Hello from endpoint 1',
//     },
//   });
// });