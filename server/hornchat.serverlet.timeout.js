module.exports = (socket) => {
    setTimeout(() => {
        if (data[socket.id] && socket.authenticated === null) {
            socket.send(JSON.stringify({error:"TIMED_OUT", success: false, device: null}));
            console.log("[" + socket.id + "] Connection timed out");
            rateLimits[socket.ip] = new Date();
            socket.close();
        }
    }, 2000)
}