const fs = require("fs");
global.rateLimits = {};

module.exports = (socket, msg, updateConnectedDevices) => {
    if (!updateConnectedDevices) updateConnectedDevices = false;

    let data;
    try {
        data = JSON.parse(msg);
    } catch (e) {
        socket.send(JSON.stringify({error:"INVALID_DATA", fatal: true}));
        console.log("[" + socket.id + "] Unable to authenticate");
        rateLimits[socket.ip] = new Date();
        socket.close();
        return;
    }

    try {
        if (data.username && data.token) {
            console.log("[" + socket.id + "] Username:", data.username, "Token:", "<redacted>");
            let currentDevice = null;

            if (userCredentials.filter((i) => i.id === data.username).length > 0) {
                if (userCredentials.filter((i) => i.id === data.username)[0]['devices'].length > 0) {
                    for (let device of userCredentials.filter((i) => i.id === data.username)[0]['devices']) {
                        if (data.token === device.token) {
                            currentDevice = device;
                            global.userCredentials = userCredentials.map((i) => {
                                if (i.id === data.username) {
                                    i.devices = i.devices.map((j) => {
                                        if (data.token === j.token) {
                                            j.addresses = [...new Set([...j.addresses, socket.ip])];
                                            j.lastSeen = new Date();
                                        }

                                        return j;
                                    })
                                }

                                return i;
                            })

                            fs.writeFileSync(dataPath + "/users.json", JSON.stringify(userCredentials, null, 2));
                            socket.send(JSON.stringify({device: device.id}));
                            console.log("[" + socket.id + "] Authenticated successfully");

                            if (updateConnectedDevices) {
                                if (!connectedDevices[data.username]) connectedDevices[data.username] = [];
                                connectedDevices[data.username].push(device.id);
                            }

                            socket.authenticated = {
                                device: device.id,
                                user: data.username
                            }

                            break;
                        }
                    }
                }
            } else {
                socket.send(JSON.stringify({error:"USER_NOT_FOUND", fatal: true}));
                console.log("[" + socket.id + "] Unable to authenticate");
                rateLimits[socket.ip] = new Date();
                socket.close();
            }
        } else {
            socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: true}));
            console.log("[" + socket.id + "] Unable to authenticate");
            rateLimits[socket.ip] = new Date();
            socket.close();
        }
    } catch (e) {
        console.error(e);
        socket.send(JSON.stringify({error:"INTERNAL_ERROR", fatal: true}));
        console.log("[" + socket.id + "] Unable to authenticate");
        rateLimits[socket.ip] = new Date();
        socket.close();
    }
}