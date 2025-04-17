const fs = require("fs");

module.exports = (socket, msg) => {
    if (!msg.data) {
        socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'data' value");
        return;
    }

    if (!data[socket.id]) {
        socket.send(JSON.stringify({error:"NOT_STARTED", fatal: false}));
        console.log("[" + socket.id + "] Conversation not started");
        return;
    }

    let otherPeerSockets = Object.keys(data).filter((i) => {
        let user = data[i];
        return !!(user && user.conversation === data[socket.id].conversation && user.peer === socket.authenticated.user);
    }).map((i) => {
        return data[i].socket;
    })

    let conversationJSON = JSON.parse(fs.readFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/conversation.json").toString());
    let messagesJSON = JSON.parse(fs.readFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json").toString());

    msg.data.uuid = require('uuid-v4')();
    msg.data.id = conversationJSON["counter"] + 1;
    msg.data.date = new Date().toISOString();

    let validKeys = [];
    let validDevices = userCredentials.filter((i) => {
        return i.id === data[socket.id].peer;
    })[0].devices.map((i) => { return i.id; });
    for (let keyId of Object.keys(keys[data[socket.id].peer])) {
        if (validDevices.includes(keyId)) validKeys.push(keyId);
    }

    msg.data.recipients = validKeys;

    for (let s of otherPeerSockets) {
        msg.data.status = 1;
        s.send(JSON.stringify(msg))
        msg.data.recipients = msg.data.recipients.filter((i) => {
            return i !== s.authenticated.device;
        })
    }

    let msg2 = msg;
    msg2["_callback"] = true;
    socket.send(JSON.stringify(msg2));

    messagesJSON[msg.data.uuid] = msg;
    conversationJSON.counter++;
    fs.writeFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json", JSON.stringify(messagesJSON));
    fs.writeFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/conversation.json", JSON.stringify(conversationJSON));
}