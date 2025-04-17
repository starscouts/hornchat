module.exports = (socket, d) => {
    if (!connectedDevices[d.username]) connectedDevices[d.username] = [];
    let dev = connectedDevices[d.username];

    if (!data[socket.id]["trackedUsers"]) data[socket.id]["trackedUsers"] = [];
    if (!data[socket.id]["lastKnownTrackedUserInfo"]) data[socket.id]["lastKnownTrackedUserInfo"] = {};
    data[socket.id]["trackedUsers"].push(d.username);
    data[socket.id]["lastKnownTrackedUserInfo"][d.username] = JSON.stringify(dev);

    socket.send(JSON.stringify({error:null, success:true, fatal: false, manual: true, data: dev, username: d.username}));
}