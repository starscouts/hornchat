const fs = require("fs");

module.exports = (socket, msg) => {
    let messagesJSON = JSON.parse(fs.readFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json").toString());

    let validKeys = [];
    let validDevices = userCredentials.filter((i) => {
        return i.id === data[socket.id].peer;
    })[0].devices.map((i) => { return i.id; });
    for (let keyId of Object.keys(keys[data[socket.id].peer])) {
        if (validDevices.includes(keyId)) validKeys.push(keyId);
    }

    let otherPeerSockets = Object.keys(data).filter((i) => {
        let user = data[i];
        return !!(user && user.conversation === data[socket.id].conversation && user.peer === socket.authenticated.user);
    }).map((i) => {
        return data[i].socket;
    })

    for (let id of Object.keys(messagesJSON)) {
        let message = messagesJSON[id];

        if (message.data.text && Object.keys(message.data.text).includes(socket.authenticated.device) && message.data.status !== 2) {
            message.data.status = 2;
            message._callback = false;

            let update = {
                type: "status_update",
                data: {
                    status: message.data.status,
                    recipients: validKeys,
                    message: message.data.uuid
                }
            }

            for (let s of otherPeerSockets) {
                s.send(JSON.stringify(update))
                update.data.recipients = update.data.recipients.filter((i) => {
                    return i !== s.authenticated.device;
                })
            }

            messagesJSON[require('uuid-v4')()] = update;
        }

        messagesJSON[id] = message;
    }

    socket.send(JSON.stringify({success: true}));
    fs.writeFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json", JSON.stringify(messagesJSON));
}