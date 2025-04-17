module.exports = (socket, data) => {
    if (tokenFetchrateLimits[socket.ip] && new Date() - tokenFetchrateLimits[socket.ip] < 30000) {
        socket.send(JSON.stringify({error:"RATE_LIMITED", success: false, device: null}));
        console.log("[" + socket.id + "] IP address is being rate limited");
        tokenFetchrateLimits[socket.ip] = new Date();
        socket.close();
        return;
    }

    if (userCredentials.filter((i) => i.id === data.username).length > 0) {
        if (userCredentials.filter((i) => i.id === data.username)[0].devices) {
            let tokens = userCredentials.filter((i) => i.id === data.username)[0].devices.map((i) => {
                return i.token;
            });

            if (tokens.includes(data.token)) {
                socket.send(JSON.stringify({error:null, success: true, device: null}));
            } else {
                socket.send(JSON.stringify({error:null, success: false, device: null}));
                tokenFetchrateLimits[socket.ip] = new Date();
            }

            socket.close();
        } else {
            socket.send(JSON.stringify({error:null, success: false, device: null}));
            tokenFetchrateLimits[socket.ip] = new Date();
            socket.close();
        }
    } else {
        socket.send(JSON.stringify({error:null, success: false, device: null}));
        tokenFetchrateLimits[socket.ip] = new Date();
        socket.close();
    }
}