module.exports = (username) => {
    let hex = require('crypto').createHash("sha256").update(Object.keys(keys[username]).map((i) => {
        return keys[username][i];
    }).map((i) => {
        return JSON.stringify(i);
    }).join("|")).digest("hex");

    return {
        raw: hex,
        user: BigInt("0x" + hex).toString().substring(0, 60),
        parts: BigInt("0x" + hex).toString().substring(0, 60).match(/.{1,5}/g),
        colors: hex.substring(0, 36).match(/.{1,6}/g)
    };
}