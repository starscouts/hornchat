const fs = require("fs");

module.exports = (socket, msg) => {
    if (!msg.text) {
        socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'username' value");
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

    for (let s of otherPeerSockets) {
        s.send(JSON.stringify({
            type: "typing",
            text: msg.text,
            reply: msg.reply,
            attachments: parseInt(msg.attachments),
            position: msg.position
        }))
    }

    socket.send(JSON.stringify({success: true}));
}