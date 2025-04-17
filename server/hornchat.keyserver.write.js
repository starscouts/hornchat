const fs = require("fs");

module.exports = (socket, data) => {
    if (!data.publicKey) {
        socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'publicKey' value");
        return;
    }

    if (!keys[socket.authenticated.user]) keys[socket.authenticated.user] = {};
    keys[socket.authenticated.user][socket.authenticated.device] = data.publicKey;
    fs.writeFileSync(dataPath + "/keys.json", JSON.stringify(keys, null, 2));

    socket.send(JSON.stringify({error:null, success:true, fatal: false}));
    console.log("[" + socket.id + "] Updated public key");
}