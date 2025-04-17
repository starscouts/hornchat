const fs = require("fs");
const _list = require('./hornchat.keyserver.list');

module.exports = (socket, data) => {
    console.log("[" + socket.id + "] Disconnect method");

    if (!data.device) {
        socket.send(JSON.stringify({error: "MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'device' value");
        return;
    }

    let candidateDevices = userCredentials.filter((i) => {
        return i.id === socket.authenticated.user;
    })[0].devices.filter((i) => {
        return i.id === data.device;
    });

    if (candidateDevices.length !== 1) {
        socket.send(JSON.stringify({error:"INVALID_DEVICE", fatal: false}));
        console.log("[" + socket.id + "] Invalid 'device' value");
        return;
    }

    global.userCredentials = userCredentials.map((i) => {
        if (i.id === socket.authenticated.user) {
            i.devices = i.devices.map((j) => {
                if (j.id === data.device) {
                    return null;
                } else {
                    return j;
                }
            }).filter((j) => {
                return j !== null;
            })

            return i;
        } else {
            return i;
        }
    })
    fs.writeFileSync(dataPath + "/users.json", JSON.stringify(userCredentials, null, 2));
    fs.writeFileSync(dataPath + "/keys.json", JSON.stringify(keys, null, 2));

    _list(socket, data);
}