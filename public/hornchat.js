if (localStorage.getItem("db-version") === null) {
    localStorage.setItem("db-version", "1");
}

localStorage.setItem("db-version", (parseInt(localStorage.getItem("db-version")) + 1).toString());

window.HornchatDB = {
    _database: null,
    _request: window.indexedDB.open("HornchatData", parseInt(localStorage.getItem("db-version"))),
    setItem: (key, value) => {
        if (!window.HornchatDB._database) throw new DOMException("Tried to operate on an unloaded database.");

        let transaction = window.HornchatDB._database.transaction(["data"], "readwrite");
        let objectStore = transaction.objectStore("data", { keyPath: "id" });

        objectStore.delete(key);

        transaction = window.HornchatDB._database.transaction(["data"], "readwrite");
        objectStore = transaction.objectStore("data", { keyPath: "id" });

        objectStore.add(value, key);
    },
    removeItem: (key) => {
        if (!window.HornchatDB._database) throw new DOMException("Tried to operate on an unloaded database.");

        const transaction = window.HornchatDB._database.transaction(["data"], "readwrite");
        const objectStore = transaction.objectStore("data", { keyPath: "id" });

        objectStore.delete(key);
    },
    getItem: async (key) => {
        return new Promise((res, rej) => {
            if (!window.HornchatDB._database) throw new DOMException("Tried to operate on an unloaded database.");

            const transaction = window.HornchatDB._database.transaction(["data"], "readwrite");
            const objectStore = transaction.objectStore("data", { keyPath: "id" });

            let request = objectStore.get(key);

            request.onsuccess = (event) => {
                if (event.target.result === undefined) {
                    res(null);
                } else {
                    res(event.target.result);
                }
            }
        })
    }
}

window.HornchatDB._request.onerror = (error) => {
    console.error(error);
    document.getElementById("database-error").style.display = "flex";
    document.getElementById("database-error-message").innerText = "Database is corrupt";
    document.getElementById("database-error-description").innerText = "Hornchat tried to open the local client database but an error occurred while doing so. Contact the developers for additional instructions.";
}

window.HornchatDB._request.onblocked = (error) => {
    console.error(error);
    document.getElementById("database-error").style.display = "flex";
    document.getElementById("database-error-message").innerText = "Database in use";
    document.getElementById("database-error-description").innerText = "Your client's database is already in use by another Hornchat instance. Close any open Hornchat instance (e.g. in another tab) and try again.";
}

window.HornchatDB._request.onsuccess = async (event) => {
    window.HornchatDB._database = event.target.result;
    delete window.HornchatDB._request;

    await application();
}

window.HornchatDB._request.onupgradeneeded = (event) => {
    let db = event.target.result;
    try {
        db.createObjectStore("data");
    } catch (e) {
        if (e.message !== "Failed to execute 'createObjectStore' on 'IDBDatabase': An object store with the specified name already exists.") throw e;
    }
}

window.successCode = 0;
window.typingEventDecay = null;
window.hasUnreadMessages = false;
window.replyingTo = null;
window.connectedServers = 0;
window.base91 = new BaseEx.Base91();
window.attachedFiles = [];

class HornchatInstance {
    constructor() {
        this.connection = {
            get isLimited() {
                return navigator.connection.type === "cellular" || navigator.connection.type === "bluetooth" || navigator.connection.saveData;
            },
            get isMobileData() {
                return navigator.connection.type === "cellular" || navigator.connection.type === "bluetooth";
            }
        }

        this.onreceive = {
            profile: async (data) => {
                if (!window.PluralKit) window.PluralKit = {};
                if (data.username === window.peer) {
                    window.PluralKit.remote = data.data;
                } else {
                    window.PluralKit.local = data.data;
                }
            }
        };
    }

    async encrypt(message) {
        let em = {};

        for (let key of window.secretKeys) {
            let counter = crypto.getRandomValues(new Uint8Array(16));
            let pl = {}

            pl.counter = this.arrayBufferToBase64(counter.buffer);
            pl.payload = this.arrayBufferToBase64(await crypto.subtle.encrypt({name: "AES-CTR", counter: counter, length: 64}, key.secret, (new TextEncoder()).encode(message)));
            pl.sender = window.currentDevice;

            em[key.target] = pl;
        }

        return em;
    }

    async encryptBuffer(buffer) {
        let em = {};

        for (let key of window.secretKeys) {
            let counter = crypto.getRandomValues(new Uint8Array(16));
            let pl = {}

            pl.counter = this.arrayBufferToBase64(counter.buffer);
            pl.payload = base91.encode(new Uint8Array(await crypto.subtle.encrypt({name: "AES-CTR", counter: counter, length: 64}, key.secret, buffer)), "bytes", "str");
            pl.sender = window.currentDevice;

            em[key.target] = pl;
        }

        return em;
    }

    async decrypt(message) {
        for (let device of Object.keys(message)) {
            let entry = message[device];

            for (let key of secretKeys) {
                if (key.source === device && key.target === entry.sender) {
                    return window.atob(this.arrayBufferToBase64(await crypto.subtle.decrypt({name: "AES-CTR", counter: new Uint8Array(this.base64ToArrayBuffer(entry.counter)), length: 64}, key.secret, this.base64ToArrayBuffer(entry.payload))));
                }
            }
        }
    }

    async decryptBuffer(message) {
        for (let device of Object.keys(message)) {
            let entry = message[device];

            for (let key of secretKeys) {
                if (key.source === device && key.target === entry.sender) {
                    return await crypto.subtle.decrypt({name: "AES-CTR", counter: new Uint8Array(this.base64ToArrayBuffer(entry.counter)), length: 64}, key.secret, base91.decode(entry.payload, "str", "bytes"));
                }
            }
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        let bytes = new Uint8Array(buffer);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa( binary );
    }

    base64ToArrayBuffer(base64) {
        let binary_string = window.atob(base64);
        let len = binary_string.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async connect(loginInfo) {
        window.loginInfo = JSON.stringify(loginInfo);
        localStorage.setItem("background-sync-credentials", JSON.stringify({
            login_info: loginInfo,
            peer: window.peer
        }));

        for (let server of Object.keys(HornchatServers)) {
            if (server === "authentication") continue;

            await this.startConnection(server);
        }
    }

    async startConnection(server) {
        window[server] = new WebSocket(HornchatServers[server]);
        window[server].onopen = async () => {
            console.log("[" + server + "] Connection established");
            window.connectedServers++;
            window[server].send(loginInfo);

            if (server === "keyserver") {
                window[server].send(JSON.stringify({
                    type: "write",
                    publicKey: JSON.parse(await HornchatDB.getItem("local-keypair")).publicKey
                }))
            }

            if (server === "conversation") {
                console.warn("We are now going to initialize the conversation!");
                window[server].send(JSON.stringify({
                    type: "start",
                    username: window.peer
                }))

                document.getElementById("login-progress").innerText = "Loading messages, please wait...";

                window.messageDataRestoreInterval = setInterval(async () => {
                    if (typeof PluralKit === "object" && typeof PluralKit.local === "object" && typeof PluralKit.remote === "object" && typeof secretKeys === "object") {
                        clearInterval(window.messageDataRestoreInterval);

                        if (await HornchatDB.getItem("message-index") === null) HornchatDB.setItem("message-index", "{}");

                        let list = Object.keys(JSON.parse(await HornchatDB.getItem("message-index")));

                        let index = 1;
                        for (let id of list) {
                            document.getElementById("login-progress").innerText = "Loading messages, please wait... " + index + "/" + list.length;

                            document.getElementById("timeline-messages").innerHTML += `<div id="message-${id}-container"></div>`;
                            await Hornchat.drawMessage(id);

                            index++;
                        }

                        document.getElementById("login").style.display = "none";
                        document.getElementById("app").style.display = "";
                        await Hornchat.timelineBottom()
                    }
                }, 10);
            }

            if (server === "profile") {
                window[server].send(JSON.stringify({
                    username: JSON.parse(window.loginInfo).username
                }))
                window[server].send(JSON.stringify({
                    username: peer
                }))
            }

            if (server === "presence") {
                window[server].send(JSON.stringify({
                    username: JSON.parse(window.loginInfo).username
                }))
                window[server].send(JSON.stringify({
                    username: peer
                }))
            }

            if (server === "verification") {
                window[server].send(JSON.stringify({
                    username: JSON.parse(window.loginInfo).username
                }))
                window[server].send(JSON.stringify({
                    username: peer
                }))
            }
        }

        window[server].onclose = (e) => {
            if (e.wasClean) {
                console.log("[" + server + "] Connection closed normally (code " + e.code + "), not resetting link");
            } else {
                console.log("[" + server + "] Connection closed unexpectedly (code " + e.code + "), resetting link");
                window.connectedServers--;
                setTimeout(() => {
                    this.startConnection(server);
                }, 1000)
            }
        }

        window[server].onmessage = async (e) => {
            let data = JSON.parse(e.data);
            console.log("[" + server + "] ", data);

            if (data.success) window.successCode++;

            if (data.error && window.inLoginProcess) {
                switch (data.error) {
                    case "INVALID_USER":
                        await loginError("This recipient does not exist (INVALID_USER).");
                        break;

                    case "USER_NOT_FOUND":
                        await loginError("This user does not exist (USER_NOT_FOUND).");
                        break;

                    case "INVALID_TOTP":
                        await loginError("The entered 2FA code is incorrect (INVALID_TOTP).");
                        break;

                    case "RATE_LIMITED":
                        await loginError("You are being rate limited, please try again later (RATE_LIMITED).");
                        break;

                    case "MISSING_OPERAND":
                        await loginError("The server didn't receive all the data needed (MISSING_OPERAND).");
                        break;

                    case "INVALID_DATA":
                        await loginError("The server didn't receive the data in a usable state (INVALID_DATA).");
                        break;

                    case "INTERNAL_ERROR":
                        await loginError("An internal server error occurred, please contact the developers (INTERNAL_ERROR).");
                        break;

                    default:
                        await loginError(data.error);
                        break;
                }
            }

            if (this.onreceive[server]) await this.onreceive[server](data);
        }
    }

    detectSystemMember(text, local) {
        let proxies = Object.keys(PluralKit[local ? "local" : "remote"].members).map((i) => {
            return PluralKit[local ? "local" : "remote"].members[i].proxy
        }).reduce((a, b) => {
            return [...a, ...b];
        });

        let matchedProxy = false;
        let matchedProxyText = null;
        let matchedProxyData = null;
        let matchedProxyMember = null;

        for (let proxy of proxies) {
            if (proxy.prefix !== null && text.startsWith(proxy.prefix)) {
                if (proxy.suffix !== null) {
                    if (text.endsWith(proxy.suffix)) {
                        matchedProxy = true;
                        matchedProxyData = proxy;
                        matchedProxyText = text.substring(proxy.prefix.length, text.length - proxy.suffix.length).trim();
                        matchedProxyMember = PluralKit[local ? "local" : "remote"].members[Object.keys(PluralKit[local ? "local" : "remote"].members).filter((i) => {
                            let m = PluralKit[local ? "local" : "remote"].members[i];

                            for (let sp of m.proxy) {
                                if (sp.prefix === proxy.prefix && sp.suffix === proxy.suffix) return true;
                            }

                            return false;
                        })[0]];
                    }
                } else {
                    matchedProxy = true;
                    matchedProxyData = proxy;
                    matchedProxyText = text.substring(proxy.prefix.length, text.length).trim();
                    matchedProxyMember = PluralKit[local ? "local" : "remote"].members[Object.keys(PluralKit[local ? "local" : "remote"].members).filter((i) => {
                        let m = PluralKit[local ? "local" : "remote"].members[i];

                        for (let sp of m.proxy) {
                            if (sp.prefix === proxy.prefix && sp.suffix === proxy.suffix) return true;
                        }

                        return false;
                    })[0]];
                }
            } else if (proxy.suffix !== null && text.endsWith(proxy.suffix)) {
                if (proxy.prefix !== null) {
                    if (text.startsWith(proxy.prefix)) {
                        matchedProxy = true;
                        matchedProxyData = proxy;
                        matchedProxyText = text.substring(proxy.prefix.length, text.length - proxy.suffix.length).trim();
                        matchedProxyMember = PluralKit[local ? "local" : "remote"].members[Object.keys(PluralKit[local ? "local" : "remote"].members).filter((i) => {
                            let m = PluralKit[local ? "local" : "remote"].members[i];

                            for (let sp of m.proxy) {
                                if (sp.prefix === proxy.prefix && sp.suffix === proxy.suffix) return true;
                            }

                            return false;
                        })[0]];
                    }
                } else {
                    matchedProxy = true;
                    matchedProxyData = proxy;
                    matchedProxyText = text.substring(0, text.length - proxy.suffix.length).trim();
                    matchedProxyMember = PluralKit[local ? "local" : "remote"].members[Object.keys(PluralKit[local ? "local" : "remote"].members).filter((i) => {
                        let m = PluralKit[local ? "local" : "remote"].members[i];

                        for (let sp of m.proxy) {
                            if (sp.prefix === proxy.prefix && sp.suffix === proxy.suffix) return true;
                        }

                        return false;
                    })[0]];
                }
            }
        }

        if (matchedProxy) {
            let color = matchedProxyMember.color;
            return {
                text: matchedProxyText,
                member: {
                    id: matchedProxyMember.id,
                    data: matchedProxyMember
                },
                colors: {
                    background: color,
                    foreground: this.hexCodeToBW(color)
                },
                autoProxy: false
            }
        } else {
            let color = PluralKit[local ? "local" : "remote"].members[PluralKit[local ? "local" : "remote"].fronters[0]].color;
            return {
                text,
                member: {
                    id: PluralKit[local ? "local" : "remote"].fronters[0],
                    data: PluralKit[local ? "local" : "remote"].members[PluralKit[local ? "local" : "remote"].fronters[0]]
                },
                colors: {
                    background: color,
                    foreground: parseInt("0x" + color.substring(0, 2)) + parseInt("0x" + color.substring(2, 4)) + parseInt("0x" + color.substring(4, 6)) > 382 ? "000000" : "ffffff"
                },
                autoProxy: true
            }
        }
    }

    deleteDevice(id, callback) {
        window.deviceRemovalServer = new WebSocket(HornchatServers.keyserver);
        window.deviceToRemoveId = id;

        deviceRemovalServer.onopen = async () => {
            console.log("[deviceRemovalServer] Connection established");
            deviceRemovalServer.send(await HornchatDB.getItem("device-login-info"));
        }

        deviceRemovalServer.onmessage = async (e) => {
            let data = JSON.parse(e.data);
            console.log("[deviceRemovalServer] ", data);

            if (this.onreceive["keyserver"]) await this.onreceive["keyserver"](data, true);
            callback();
        }
    }

    hexCodeToBW (hex) {
        return parseInt("0x" + hex.substring(0, 2)) + parseInt("0x" + hex.substring(2, 4)) + parseInt("0x" + hex.substring(4, 6)) > 400 ? "000000" : "ffffff";
    }

    async checkToken(deviceInfo, ifValid, ifInvalid) {
        let token = deviceInfo.token;
        let username = deviceInfo.username;

        let authentication = new WebSocket(HornchatServers.authentication);
        authentication.onopen = () => {
            console.log("[authentication] Connection established");
            authentication.send(JSON.stringify({
                username,
                token
            }));
        }

        authentication.onclose = (event) => {
            console.log("[authentication] Connection closed");

            if (!event.wasClean) {
                document.getElementById("login").style.display = "";
                document.getElementById("login-progress").style.display = "none";
                document.getElementById("login-error").style.display = "none";
                document.getElementById("login-offline").style.display = "";
                document.getElementById("login-form").style.display = "none";
                document.getElementById("loader").style.display = "none";
            }
        }

        authentication.onmessage = async (e) => {
            let data = JSON.parse(e.data);
            console.log("[authentication] ", data);

            if (data.error === null) {
                if (data.success) {
                    await ifValid();
                } else {
                    await ifInvalid();
                }
            } else if (data.error === "RATE_LIMITED") {
                document.getElementById("loader-message").innerText = "You are being rate limited, refreshing in 1 minute...";
                setTimeout(() => {
                    location.reload();
                }, 60000);
            }
        }
    }

    resolvePluralKit(target, id) {
        if (target !== "remote" && target !== "local") throw new Error();

        let members = PluralKit[target].members;
        return members[id];
    }

    timelineBottom() {
        let el = document.getElementById("timeline");
        el.scrollTop = el.scrollHeight;
    }

    markdown(text) {
        if (text === null || text === undefined) {
            return "<i>Failed to decrypt message</i>";
        }

        text = text.replaceAll("\n", "<br>").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

        return marked.parseInline(text).replaceAll("\n", "<br>");
    }

    async dispatchTypingEvent() {
        if (window.hasUnreadMessages) {
            conversation.send(JSON.stringify({
                type: "read"
            }));

            window.hasUnreadMessages = false;
        }

        conversation.send(JSON.stringify({
            type: "typing",
            reply: window.replyingTo,
            attachments: window.attachedFiles.length,
            text: await this.encrypt(document.getElementById("composer-text").value),
            position: await this.encrypt(JSON.stringify({
                start: document.getElementById("composer-text").selectionStart.toString(),
                end: document.getElementById("composer-text").selectionEnd.toString()
            }))
        }))
    }

    async processTypingEvent(text, position, reply, attachments) {
        if (window.typingEventDecay) clearTimeout(window.typingEventDecay);

        if (Hornchat.detectSystemMember(text).text.trim() === "") {
            document.getElementById("typing-indicator").style.display = "none";
        } else {
            document.getElementById("typing-indicator").style.display = "";
        }

        if (reply) {
            let originalMessage = null;
            let timelineID = null;
            let message = null;
            let sender = null;

            let index = await HornchatDB.getItem("message-index");
            if (index) timelineID = JSON.parse(index)[reply];
            if (timelineID) originalMessage = await HornchatDB.getItem("message-" + timelineID);
            if (originalMessage) message = JSON.parse(originalMessage);

            if (message) {
                try {
                    sender = PluralKit[message._callback ? "local" : "remote"].members[message.data.sender].name;
                } catch (e) {
                    sender = null;
                }
            }

            if (message && sender) {
                document.getElementById("typing-indicator-badge").innerHTML = "Replying to <b>" + sender + "</b>";
                document.getElementById("typing-indicator-badge").style.display = "";
            } else {
                document.getElementById("typing-indicator-badge").innerHTML = "Replying";
                document.getElementById("typing-indicator-badge").style.display = "";
            }
        } else {
            document.getElementById("typing-indicator-badge").style.display = "none";
        }

        if (!isNaN(attachments) && isFinite(attachments) && attachments > 0) {
            document.getElementById("typing-indicator-badge2").innerHTML = "Attached <b>" + attachments + " file" + (attachments > 1 ? "s" : "") + "</b>";
            document.getElementById("typing-indicator-badge2").style.display = "";
        } else {
            document.getElementById("typing-indicator-badge2").style.display = "none";
        }

        let message;
        if (position.start === position.end) {
            let beforeCaret = Hornchat.detectSystemMember(text).text.substring(0, position.start).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
            let afterCaret = Hornchat.detectSystemMember(text).text.substring(position.start).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
            let caret = '<span class="timeline-message-typing-caret">|</span>';
            message = beforeCaret + caret + afterCaret;
        } else {
            let beforeSelect = Hornchat.detectSystemMember(text).text.substring(0, position.start).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            let inSelect = Hornchat.detectSystemMember(text).text.substring(position.start, position.end).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            let afterSelect = Hornchat.detectSystemMember(text).text.substring(position.end).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            message = beforeSelect + "<span class='timeline-message-typing-select'>" + inSelect + "</span>" + afterSelect;
        }

        document.getElementById("typing-indicator-text").innerHTML = message;
        document.getElementById("typing-indicator-author").innerText = Hornchat.detectSystemMember(text).member.data.name;
        this.timelineBottom();

        window.typingEventDecay = setTimeout(() => {
            document.getElementById("typing-indicator").style.display = "none";
            this.timelineBottom();
        }, 5000);
    }

    async prepareTextMessage (text) {
        return {
            id: null,
            uuid: null,
            sender: Hornchat.detectSystemMember(text, true).member.id,
            date: new Date().toISOString(),
            origin: window.replyingTo,
            attachments: window.attachedFiles.map((i) => {
                return {
                    metadata: i["metadata"],
                    contents: i["contents"]
                }
            }),
            text: await this.encrypt(Hornchat.detectSystemMember(text, true).text),
            status: 0
        }
    }

    async sendMessage (text) {
        document.getElementById("composer-text").disabled = true;
        document.getElementById("footer-actions").classList.add("disabled");
        document.getElementById("footer-item").classList.add("disabled");
        document.getElementById("footer-item2").classList.add("disabled");
        let payload = await this.prepareTextMessage(text);
        conversation.send(JSON.stringify({
            type: "message",
            data: payload
        }));
    }

    cancelReply () {
        window.replyingTo = null;

        document.getElementById("footer-input").classList.remove("hasItem");
        document.getElementById("footer-item").innerHTML = "";

        document.getElementById("composer-text").focus();
        this.dispatchTypingEvent();
    }

    async setReplyMessage (event, uuid) {
        if (event.target.classList.contains("timeline-message-reply-author")
         || event.target.classList.contains("timeline-message-reply-text")
         || event.target.classList.contains("timeline-message-reply")
         || event.target.classList.contains("timeline-message-file-action")
        ) return;

        let data = JSON.parse(await HornchatDB.getItem("message-" + JSON.parse(await HornchatDB.getItem("message-index"))[uuid]));
        let member;

        if (data._callback) {
            member = PluralKit.local.members[data.data.sender];
        } else {
            member = PluralKit.remote.members[data.data.sender];
        }

        window.replyingTo = uuid;

        document.getElementById("footer-input").classList.add("hasItem");
        document.getElementById("footer-item").innerHTML = "<a class='footer-item-cancel' onclick='Hornchat.cancelReply();' style='display:inline-block;'><span style='vertical-align: middle;'>Replying to <b>" + member.name + "</b></span> <img alt='Cancel' src='/cancel.svg' style='filter:invert(1);width:14px;vertical-align: middle;'></a>";

        document.getElementById("composer-text").focus();
        await this.dispatchTypingEvent();
    }

    online () {
        document.getElementById("footer-offline").style.display = "none";
        document.getElementById("footer-online").style.display = "";
    }

    offline () {
        document.getElementById("footer-offline").style.display = "";
        document.getElementById("footer-online").style.display = "none";
    }

    async getDecryptedFiles (files) {
        let decrypted = [];

        for (let file of files) {
            try {
                let u;
                if (file._originalContents) {
                    u = base91.decode(file._originalContents, "str", "bytes").buffer;
                } else {
                    u = await this.decryptBuffer(file.contents);
                }

                let m;
                if (file._originalMetadata) {
                    m = JSON.stringify(file._originalMetadata);
                } else {
                    m = await this.decrypt(file.metadata);
                }

                let c = pako.inflate(u);

                decrypted.push({
                    metadata: JSON.parse(m),
                    contents: c,
                    _url: URL.createObjectURL(new Blob([c]))
                })
            } catch (e) {
                console.error(e);
            }
        }

        return decrypted;
    }

    async drawMessage (uuid) {
        let data = JSON.parse(await HornchatDB.getItem("message-" + JSON.parse(await HornchatDB.getItem("message-index"))[uuid]));
        let files = await this.getDecryptedFiles(data.data.attachments);
        if (files.length > 0) console.log(files);

        let composerText;
        try {
            composerText = Hornchat.detectSystemMember(document.getElementById("composer-text").value, true).text;
        } catch (e) {
            composerText = document.getElementById("composer-text").value;
        }

        let text;
        let css;
        let invert;
        let pk;

        if (data._callback) {
            pk = PluralKit.local.members[data.data.sender];
            text = Hornchat.markdown(data.originalText);
            css = "background-color: #" + pk.color + ";color: #" + Hornchat.hexCodeToBW(pk.color) + ";";
            invert = Hornchat.hexCodeToBW(pk.color) !== "000000";
        } else {
            pk = PluralKit.remote.members[data.data.sender];
            text = Hornchat.markdown(await Hornchat.decrypt(data.data.text));
            css = "background-color: #" + pk.color + "55;color: white;";
            invert = true;
        }

        let reply = "";
        if (data.data.origin !== null) {
            let replyMessage = JSON.parse(await HornchatDB.getItem("message-" + JSON.parse(await HornchatDB.getItem("message-index"))[data.data.origin]));

            if (!replyMessage) {
                reply = `
<a class="timeline-message-reply" style="background-color: #ffffff55;border-color: #ffffffaa;">
    <span class="timeline-message-reply-text"><i>Unable to find the message that was replied to.</i></span>
</a>
                `;
            } else {
                let replyText;
                let replyCss;
                let replyPk;

                if (replyMessage._callback) {
                    replyPk = PluralKit.local.members[replyMessage.data.sender];
                    replyText = Hornchat.markdown(replyMessage.originalText);
                    replyCss = "background-color: #" + replyPk.color + "55;border-color: #" + replyPk.color + "aa;";
                } else {
                    replyPk = PluralKit.remote.members[replyMessage.data.sender];
                    replyText = Hornchat.markdown(await Hornchat.decrypt(replyMessage.data.text));
                    replyCss = "background-color: #" + replyPk.color + "55;border-color: #" + replyPk.color + "aa;";
                }

                reply = `
<a href="#message-${data.data.origin}-container" class="timeline-message-reply" style="${replyCss}">
    <span class="timeline-message-reply-author">${replyPk.name}</span>
    <span class="timeline-message-reply-text">${replyText}</span>
</a>
                `;
            }
        }

        let filesPreview = ``;

        if (files.length > 0) {
            for (let file of files) {
                filesPreview += `
<span class="timeline-message-file">
    <a class="timeline-message-file-link timeline-message-file-action" href="${file._url}" download="${file.metadata.name}">
        <img alt="Download" src="/download.svg" style="width:24px;vertical-align: middle;filter:invert(1);">
        <span style="vertical-align: middle;">${file.metadata.name}</span>
    </a>
</span>
`;
            }
        }

        document.getElementById("message-" + uuid + "-container").outerHTML = `
<div onclick="Hornchat.setReplyMessage(event, '${data.data.uuid}');" id="message-${data.data.uuid}-container" class="timeline-message-container timeline-message-container-${data._callback ? 'sent' : 'received'}">
    <div id="message-${data.data.uuid}" class="timeline-item timeline-message timeline-message-${data._callback ? 'sent' : 'received'}" style="${css}">
        ${reply}
        <div class="timeline-message-files">${filesPreview}</div>
        <div class="timeline-message-inner">
            <div class="timeline-message-text">
              ${text}
            </div>
            <div class="timeline-message-footer">
                <span class="timeline-message-author">${pk.name}</span>
                <span class="timeline-message-date">${new Date(data.data.date).toTimeString().substring(0, 5)}</span>` + (data._callback ? `
                <span class="timeline-message-status">
                    <img alt="" src="/${data.data.status === 0 ? 'sent' : (data.data.status === 1 ? 'received' : 'read')}.svg">
                </span>` : "") +
        `
            </div>
        </div>
    </div>
</div>
`;
        this.timelineBottom();
    }

    async removeAttachedFiles () {
        window.attachedFiles = [];

        document.getElementById("footer-input").classList.remove("hasItem2");
        document.getElementById("footer-item2").innerHTML = "";

        document.getElementById("composer-text").focus();
        await this.dispatchTypingEvent();
    }

    async attachFile () {
        // noinspection JSUnresolvedFunction
        let [ fileHandle ] = await window.showOpenFilePicker();
        let file = await fileHandle.getFile();

        let contents = await file.arrayBuffer();
        let compressed = pako.deflate(contents, {
            level: 9
        });

        let payload = {
            metadata: await this.encrypt(JSON.stringify({
                name: file.name,
                size: file.size,
                type: file.type
            })),
            contents: await this.encryptBuffer(compressed),
            _originalContents: base91.encode(compressed, "bytes", "str"),
            _originalMetadata: {
                name: file.name,
                size: file.size,
                type: file.type
            }
        }

        window.attachedFiles.push(payload);

        document.getElementById("footer-input").classList.add("hasItem2");
        document.getElementById("footer-item2").innerHTML = "<a class='footer-item-cancel' onclick='Hornchat.removeAttachedFiles();' style='display:inline-block;'><span style='vertical-align: middle;'>Attached <b>" + window.attachedFiles.length + " file" + (window.attachedFiles.length > 1 ? "s" : "") + "</b></span> <img alt='Cancel' src='/cancel.svg' style='filter:invert(1);width:14px;vertical-align: middle;'></a>";

        document.getElementById("composer-text").focus();
        await this.dispatchTypingEvent();
    }
}

window.Hornchat = new HornchatInstance();