require('./hornchat.serverlet.sync');

const informTrackedUsers = require('./hornchat.verification.tracking');
setInterval(() => {
    informTrackedUsers();
}, 50)

global.existingUsers = Object.keys(userCredentials).map((i) => {
    let item = userCredentials[i];
    return item["id"];
});

const WebSocket = require('ws');
const uuid = require('uuid-v4');
const fs = require("fs");
const _process = require('./hornchat.verification.process')
const _auth = require('./hornchat.serverlet.authentication')

const server = new WebSocket.Server({
    port: 8304
});

global.data = {};

server.on('connection', function (socket, req) {
    socket.ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;

    socket.authenticated = null;
    socket.id = uuid();
    console.log("New connection: " + socket.id);
    data[socket.id] = {};
    data[socket.id]["socket"] = socket;

    require('./hornchat.serverlet.timeout')(socket);

    socket.on('close', () => {
        if (socket.id) {
            delete data[socket.id];
        }
    })

    socket.on('message', function (msg) {
        if (socket.authenticated === null) {
            _auth(socket, msg);
        } else {
            let d;
            try {
                d = JSON.parse(msg);
            } catch (e) {
                socket.send(JSON.stringify({error:"INVALID_DATA", fatal: false}));
                console.log("[" + socket.id + "] Received invalid data");
                return;
            }

            if (d.username) {
                _process(socket, d);
            } else {
                socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
                console.log("[" + socket.id + "] Missing 'username' value");
            }
        }
    });
});

console.log("Listening on port 8304");