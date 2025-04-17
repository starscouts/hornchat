require('./hornchat.serverlet.sync');

const WebSocket = require('ws');
const uuid = require('uuid-v4');

global.rateLimits = {};
global.tokenFetchrateLimits = {};

const server = new WebSocket.Server({
    port: 8301
});

global.data = {};

const _totp = require('./hornchat.authentication.totp');
const _token = require('./hornchat.authentication.token');

server.on('connection', function (socket, req) {
    socket.ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;

    socket.id = uuid();
    console.log("New connection: " + socket.id);
    data[socket.id] = {};

    require('./hornchat.serverlet.timeout')(socket);

    socket.on('close', () => {
        if (socket.id) {
            delete data[socket.id];
        }
    })

    socket.on('message', function(msg) {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (e) {
            socket.send(JSON.stringify({error:"INVALID_DATA", success: false, device: null}));
            console.log("[" + socket.id + "] Unable to authenticate");
            rateLimits[socket.ip] = new Date();
            socket.close();
            return;
        }

        if (rateLimits[socket.ip] && new Date() - rateLimits[socket.ip] < 15000) {
            socket.send(JSON.stringify({error:"RATE_LIMITED", success: false, device: null}));
            console.log("[" + socket.id + "] IP address is being rate limited");
            rateLimits[socket.ip] = new Date();
            socket.close();
            return;
        }

        try {
            if (data.username && data.totp) {
                _totp(socket, data, req);
            } else if (data.username && data.token) {
                _token(socket, data);
            } else {
                socket.send(JSON.stringify({error:"MISSING_OPERAND", success: false, device: null}));
                console.log("[" + socket.id + "] Unable to authenticate");
                rateLimits[socket.ip] = new Date();
                socket.close();
            }
        } catch (e) {
            console.error(e);
            socket.send(JSON.stringify({error:"INTERNAL_ERROR", success: false, device: null}));
            console.log("[" + socket.id + "] Unable to authenticate");
            rateLimits[socket.ip] = new Date();
            socket.close();
        }
    });
});

console.log("Listening on port 8301");