const calculateSafetyNumber = require('./hornchat.verification.safety');

module.exports = (socket, d) => {
    if (!existingUsers.includes(d.username) || !keys[d.username]) {
        socket.send(JSON.stringify({error:"INVALID_USER", fatal: false}));
        console.log("[" + socket.id + "] Invalid 'username' value");
        return;
    }

    let safetyNumber = calculateSafetyNumber(d.username);

    if (!data[socket.id]["trackedUsers"]) data[socket.id]["trackedUsers"] = [];
    if (!data[socket.id]["lastKnownTrackedUserInfo"]) data[socket.id]["lastKnownTrackedUserInfo"] = {};
    data[socket.id]["trackedUsers"].push(d.username);
    data[socket.id]["lastKnownTrackedUserInfo"][d.username] = JSON.stringify(safetyNumber);

    socket.send(JSON.stringify({error:null, success:true, fatal: false, manual: true, data: safetyNumber, username: d.username}));
}