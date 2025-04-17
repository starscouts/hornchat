const fs = require('fs');

global.dataPath = require('path').resolve("../data");
global.userCredentials = require(dataPath + "/users.json");
global.keys = require(dataPath + "/keys.json");
global.pluralkit = require(dataPath + "/pluralkit.json");
global.fronters = require(dataPath + "/fronters.json");

setInterval(() => {
    try {
        global.userCredentials = JSON.parse(fs.readFileSync(dataPath + "/users.json").toString());
    } catch (e) {}
    try {
        global.keys = JSON.parse(fs.readFileSync(dataPath + "/keys.json").toString());
    } catch (e) {}
    try {
        global.pluralkit = JSON.parse(fs.readFileSync(dataPath + "/pluralkit.json").toString());
    } catch (e) {}
    try {
        global.fronters = JSON.parse(fs.readFileSync(dataPath + "/fronters.json").toString());
    } catch (e) {}
}, 10)