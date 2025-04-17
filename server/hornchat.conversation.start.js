const fs = require("fs");

function generateConversationID(user1, user2) {
    let user1hash = require('crypto').createHash("sha256").update(user1).digest("hex").split("")
    let user2hash = require('crypto').createHash("sha256").update(user2).digest("hex").split("")
    let characters = [...user1hash, ...user2hash].sort();

    return require('crypto').createHash("sha256").update(characters.join("")).digest("hex");
}

module.exports = (socket, msg) => {
    if (!msg.username) {
        socket.send(JSON.stringify({error:"MISSING_OPERAND", fatal: false}));
        console.log("[" + socket.id + "] Missing 'username' value");
        return;
    }

    if (!keys[msg.username]) {
        socket.send(JSON.stringify({error:"INVALID_USER", fatal: false}));
        console.log("[" + socket.id + "] Invalid 'username' value");
        return;
    }

    data[socket.id] = {
        peer: msg.username,
        conversation: generateConversationID(msg.username, socket.authenticated.user),
        socket
    }

    if (!fs.existsSync(dataPath + "/conversations/" + data[socket.id].conversation)) fs.mkdirSync(dataPath + "/conversations/" + data[socket.id].conversation);
    if (!fs.existsSync(dataPath + "/conversations/" + data[socket.id].conversation + "/conversation.json")) fs.writeFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/conversation.json", "{\n  \"counter\": 0\n}");
    if (!fs.existsSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json")) fs.writeFileSync(dataPath + "/conversations/" + data[socket.id].conversation + "/messages.json", "{}");
    console.log("[" + socket.id + "] Conversation " + data[socket.id].conversation + " started");

    socket.send(JSON.stringify({error: null, success: true, started: true}));

    require('./hornchat.conversation.connect')(socket);
}