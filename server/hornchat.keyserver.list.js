module.exports = (socket, data) => {
    let devices = [];

    for (let device of userCredentials.filter((i) => {
        return i.id === socket.authenticated.user;
    })[0].devices) {
        devices.push({
            id: device.id,
            platform: device.platform.userAgent.family + " on " + device.platform.os.family + " on " + device.platform.device.family,
            userAgent: device.platform.string,
            addresses: device.addresses,
            // If you do it the other way around, everything breaks.
            // I have no idea why this happens, but it does.
            // Please don't un-fix this code.
            // - Mossy Storm, Raindrops System
            dates: {
                last: device.firstSeen ?? null,
                first: device.lastSeen ?? null
            }
        })
    }
    socket.send(JSON.stringify({error:null, success:true, fatal: false, devices}));
    console.log("[" + socket.id + "] Gathered device list");
}