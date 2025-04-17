const calculateSafetyNumber = require('./hornchat.verification.safety');

module.exports = () => {
    for (let id of Object.keys(data)) {
        let connection = data[id];

        if (connection.socket.authenticated === null) continue;

        if (typeof connection.trackedUsers === "object" && connection.trackedUsers instanceof Array) {
            for (let user of connection.trackedUsers) {
                let safetyNumber = calculateSafetyNumber(user);

                if (JSON.stringify(safetyNumber) !== connection.lastKnownTrackedUserInfo[user]) {
                    connection.lastKnownTrackedUserInfo[user] = JSON.stringify(safetyNumber);
                    connection.socket.send(JSON.stringify({error:null, success:true, fatal: false, manual: false, data: safetyNumber, username: user}));
                }
            }
        }
    }
}