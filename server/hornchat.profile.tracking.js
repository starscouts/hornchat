module.exports = () => {
    for (let id of Object.keys(data)) {
        let connection = data[id];

        if (connection.socket.authenticated === null) continue;

        if (typeof connection.trackedUsers === "object" && connection.trackedUsers instanceof Array) {
            for (let user of connection.trackedUsers) {
                let pk = pluralkit[user];
                pk['fronters'] = fronters[user].fronters;

                if (JSON.stringify(pk) !== connection.lastKnownTrackedUserInfo[user]) {
                    connection.lastKnownTrackedUserInfo[user] = JSON.stringify(pk);
                    connection.socket.send(JSON.stringify({error:null, success:true, fatal: false, manual: false, data: pk, username: user}));
                }
            }
        }
    }
}