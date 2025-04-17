module.exports = (socket, data) => {
    if (!data.username) {
        socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'username' value");
        return;
    }

    if (!keys[data.username]) {
        socket.send(JSON.stringify({error:"INVALID_USER", fatal: false}));
        console.log("[" + socket.id + "] Invalid 'username' value");
        return;
    }

    let validKeys = {};
    let validDevices = userCredentials.filter((i) => {
        return i.id === data.username;
    })[0].devices.map((i) => { return i.id; });

    for (let keyId of Object.keys(keys[data.username])) {
        if (validDevices.includes(keyId)) validKeys[keyId] = keys[data.username][keyId];
    }

    socket.send(JSON.stringify({error:null, success:true, fatal: false, keys: validKeys}));
    console.log("[" + socket.id + "] Gathered public keys for " + data.username);
}