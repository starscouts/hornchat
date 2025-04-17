module.exports = (socket, d) => {
    if (!fronters[d.username] || !pluralkit[d.username]) {
        socket.send(JSON.stringify({error:"INVALID_USER", fatal: false}));
        console.log("[" + socket.id + "] Invalid 'username' value");
        return;
    }

    let pk = pluralkit[d.username];
    pk['fronters'] = fronters[d.username];

    if (!data[socket.id]["trackedUsers"]) data[socket.id]["trackedUsers"] = [];
    if (!data[socket.id]["lastKnownTrackedUserInfo"]) data[socket.id]["lastKnownTrackedUserInfo"] = {};
    data[socket.id]["trackedUsers"].push(d.username);
    data[socket.id]["lastKnownTrackedUserInfo"][d.username] = JSON.stringify(pk);

    socket.send(JSON.stringify({error:null, success:true, fatal: false, manual: true, data: pk, username: d.username}));
}
