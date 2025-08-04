//node packages
const express = require('express');
const path = require('path');
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cron = require('node-cron');
require('dotenv').config();

//local packages
const { getWemsSchedule } = require('./utilities/schedule.js');

//package configuration
const app = express();

//local configuration
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    charset: 'utf8mb4',
});

//globals
const PORT = process.env.PORT || 8080;
const SCHEDULE_URL = process.env.SCHEDULE_URL;
const WEMS_ACCESS_TOKEN = process.env.WEMS_ACCESS_TOKEN;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/suncalc.js', (_, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'suncalc', 'suncalc.js'));
});

//TODO: add server or health info to this page
app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/wems', (req, res) => {
    if (WEMS_ACCESS_TOKEN !== req.query.token) {
        res.sendStatus(403);
    } else {
        res.sendFile(path.join(__dirname, 'public/wems.html'));
    }
});

// app.get('/comms', (req, res) => {
//     if (WEBSITE_ACCESS_TOKEN !== req.query.token) {
//         res.sendStatus(403);
//     } else {
//         res.sendFile(path.join(__dirname, 'public/admin.html'));
//     }
// });

// app.get('/lf', (req, res) => {
//     if (WEBSITE_ACCESS_TOKEN !== req.query.token) {
//         res.sendStatus(403);
//     } else {
//         res.sendFile(path.join(__dirname, 'public/admin.html'));
//     }
// });

io.on('connection', async () => {
    io.emit('notes', await notes.getNotes(pool));
    io.emit('crews', await crews.getCrew(pool));
    io.emit('calls', await calls.getTotalCalls(pool));
    io.emit('mishaps', await mishap.getTotalMishaps(pool));
});

setInterval(async () => {
    io.emit('crews', await crews.getCrew(pool));
}, 60000);

cron.schedule('* * * * *', () => {
    getWemsSchedule();
});

server.listen(PORT, () => {
    console.log('crewboard is up!');
    io.emit('refresh');
});
