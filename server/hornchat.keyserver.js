require('./hornchat.serverlet.sync');

const WebSocket = require('ws');
const uuid = require('uuid-v4');
const fs = require("fs");

const _auth = require("./hornchat.serverlet.authentication");
const _disconnect = require("./hornchat.keyserver.disconnect");
const _list = require("./hornchat.keyserver.list");
const _write = require("./hornchat.keyserver.write");
const _read = require("./hornchat.keyserver.read");

const server = new WebSocket.Server({
    port: 8302
});

global.data = {};

server.on('connection', function (socket, req) {
    socket.ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;

    socket.authenticated = null;
    socket.id = uuid();
    console.log("New connection: " + socket.id);
    data[socket.id] = {};

    require("./hornchat.serverlet.timeout")(socket);

    socket.on('close', () => {
        if (socket.id) {
            delete data[socket.id];
        }
    })

    socket.on('message', function (msg) {
        if (socket.authenticated === null) {
            _auth(socket, msg);
        } else {
            let data;
            try {
                data = JSON.parse(msg);
            } catch (e) {
                socket.send(JSON.stringify({error:"INVALID_DATA", fatal: false}));
                console.log("[" + socket.id + "] Received invalid data");
                return;
            }

            if (data.type) {
                switch (data.type) {
                    case "disconnect":
                        _disconnect(socket, data);
                        break;

                    case "list":
                        _list(socket, data);
                        break;

                    case "write":
                        _write(socket, data);
                        break;

                    case "read":
                        _read(socket, data);
                        break;

                    default:
                        socket.send(JSON.stringify({error:"INVALID_TYPE", fatal: false}));
                        console.log("[" + socket.id + "] Invalid 'type' value");
                        break;
                }
            } else {
                socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
                console.log("[" + socket.id + "] Missing 'type' value");
            }
        }
    });
});

console.log("Listening on port 8302");