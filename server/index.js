const cp = require('child_process');
let processes = {};

let serverlets = [
    "authentication",
    "keyserver",
    "profile",
    "verification",
    "presence",
    "conversation"
]

for (let serverlet of serverlets) {
    startServerlet(serverlet);
}

function startServerlet(serverlet) {
    console.log("Starting " + serverlet + "...");
    processes[serverlet] = cp.spawn("node", [ "hornchat." + serverlet + ".js" ], { stdio: "pipe" });
    console.log("[" + serverlet + "] (PID: " + processes[serverlet].pid + ")")

    processes[serverlet].stdout.on('data', (data) => {
        let lines = data.toString().trim().split("\n");
        for (let line of lines) {
            console.log("[" + serverlet + "] " + line);
        }
    })

    processes[serverlet].stderr.on('data', (data) => {
        let lines = data.toString().trim().split("\n");
        for (let line of lines) {
            console.error("[" + serverlet + "] " + line);
        }
    })

    processes[serverlet].on('close', () => {
        startServerlet(serverlet);
    })
}