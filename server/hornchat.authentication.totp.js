const twofactor = require("node-2fa");
const uuid = require("uuid-v4");
const crypto = require("crypto");
const fs = require("fs");

module.exports = (socket, data, req) => {
    console.log("[" + socket.id + "] Username:", data.username, "TOTP:", data.totp);

    if (userCredentials.filter((i) => i.id === data.username).length > 0) {
        if (userCredentials.filter((i) => i.id === data.username)[0].totp.secret) {
            let verify = twofactor.verifyToken(userCredentials.filter((i) => i.id === data.username)[0].totp.secret, data.totp);

            if (verify !== null) {
                if (verify.delta > -2 && verify.delta < 2) {
                    let deviceInfo = {
                        id: uuid(),
                        token: crypto.randomBytes(256).toString('hex'),
                        platform: require('ua-parser').parse(req.headers['user-agent']),
                        addresses: [socket.ip],
                        firstSeen: new Date(),
                        lastSeen: new Date()
                    }

                    console.log("[" + socket.id + "] Authenticated successfully, added device " + deviceInfo.id);

                    global.userCredentials = userCredentials.map((i) => {
                        if (i.id === data.username) {
                            i.devices.push(deviceInfo);
                        }

                        return i;
                    })

                    fs.writeFileSync(dataPath + "/users.json", JSON.stringify(userCredentials, null, 2));

                    socket.send(JSON.stringify({error: null, success: true, device: deviceInfo}));
                    socket.close();
                } else {
                    socket.send(JSON.stringify({error:"INVALID_TOTP", success: false, device: null}));
                    console.log("[" + socket.id + "] Unable to authenticate");
                    rateLimits[socket.ip] = new Date();
                    socket.close();
                }
            } else {
                socket.send(JSON.stringify({error:"INVALID_TOTP", success: false, device: null}));
                console.log("[" + socket.id + "] Unable to authenticate");
                rateLimits[socket.ip] = new Date();
                socket.close();
            }
        }
    } else {
        socket.send(JSON.stringify({error:"USER_NOT_FOUND", success: false, device: null}));
        console.log("[" + socket.id + "] Unable to authenticate");
        rateLimits[socket.ip] = new Date();
        socket.close();
    }
}