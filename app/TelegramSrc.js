const {store, Log, path, fs, App, request, os} = require('chuijs');
const {TelegramClient, Api} = require("telegram");
const {transliterate} = require("transliteration");
const {StringSession} = require("telegram/sessions");
const json = require("../package.json");
const {SettingsStoreMarks} = require("./settings/settings_store_marks");
const {Tables} = require('./src/google_sheets/tables');
const {long, int} = require("telegram/tl/api");
let tableAuthSettings = new Tables().tableAuthSettings();

class TelegramSrc {
    #mainApp = undefined;
    #client = undefined;
    #username_new = os.userInfo().username.replaceAll(new RegExp("[^a-zA-Zа-яА-Я\\s\\d]", 'g'), '').trim().replaceAll(" ", '_');
    #sessionPath = path.join(App.userDataPath(), 'sessions_tools_trin');
    #sessionFile = `${transliterate(this.#username_new).toLowerCase()}.json`;
    #fullSessionPath = path.join(this.#sessionPath, this.#sessionFile);
    #stringSession = new StringSession("");
    #test_title = undefined;
    #chat_id = undefined;
    #report_link = [];

    constructor(mainApp) {
        this.#mainApp = mainApp;
        this.#createSessionDir();
        if (fs.existsSync(this.#fullSessionPath)) this.#stringSession = new StringSession(require(this.#fullSessionPath).session);
        this.#client = new TelegramClient(this.#stringSession, 2040, "b18441a1ff607e10a989891a5462e627", {
            appVersion: `${json.version} ${os.machine()}`,
            deviceModel: os.hostname(),
            systemVersion: "Windows 10",
            connectionRetries: 5,
            langCode: 'ru',
            systemLangCode: 'ru-RU'
        });
        this.#client.session.setDC(2, "149.154.167.41", 443);
    }

    format(date) {
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        if (day < 10) {
            day = "0" + day
        }
        if (month < 10) {
            month = "0" + month
        }
        return String(day + "-" + month + "-" + year)
    }

    #createSessionDir() {
        if (!fs.existsSync(this.#sessionPath)) fs.mkdirSync(this.#sessionPath, {recursive: true});
    }

    async #sendLog(type = String(undefined), title = String(undefined), message = String(undefined)) {
        this.#mainApp.getWindow().webContents.send("sendLog", type, title, message)
    }

    async #setProgressValue(value = Number(undefined)) {
        this.#mainApp.getWindow().webContents.send("setProgressValue", value)
    }

    async #setProgressText(text = String(undefined)) {
        this.#mainApp.getWindow().webContents.send("setProgressText", text)
    }

    async #setProgressLogText(text = String(undefined)) {
        this.#mainApp.getWindow().webContents.send("setProgressLogText", text)
    }

    async #closeDialog() {
        this.#mainApp.getWindow().webContents.send("closeDialog")
    }

    async #sendUserData(user) {
        this.#mainApp.getWindow().webContents.send("sendUserData", user)
    }

    async #sendNotification(text, body) {
        this.#mainApp.getWindow().webContents.send("sendNotification", text, body)
    }

    async #sendAuthPhoneError(title = String(undefined), message = String(undefined)) {
        this.#mainApp.getWindow().webContents.send("sendAuthPhoneError", title, message)
    }

    async #sendAuthStatus(status = Boolean(undefined)) {
        this.#mainApp.getWindow().webContents.send("sendAuthStatus", status)
    }

    async #loginInQRCode() {
        this.#mainApp.getWindow().webContents.send("loginInQRCode")
    }

    //
    async #saveSession() {
        try {
            let sessionString = await this.#client.session.save();
            let json = `{"session": "${sessionString}"}`
            fs.writeFileSync(this.#fullSessionPath, json);
            await this.#sendLog('success', `Сохранение сессии`, `Сессия успешно сохранена!`)
        } catch (e) {
            Log.error(e.message)
            await this.#sendLog('error', `Сохранение сессии`, `Ошибка: ${e}`)
        }
    }

    async #createUserData(tag_tg = String(undefined)) {
        let users = await tableAuthSettings.read('USERS!A1:C').catch(async err => await this.#sendLog('error', `Настройки пользователя`, err));
        users.forEach(user => {
            if (user[0] === tag_tg) {
                setTimeout(async () => {
                    this.#mainApp.getWindow().webContents.send("user_data", user[0], user[1], user[2]);
                    await this.#sendLog('success', `Настройки пользователя`, `Настройки загружены`)
                }, 1000);
            }
        })
    }

    //
    async getUser() {
        await this.#client.connect();
        try {
            const me = await this.#client.getMe();
            await this.#sendUserData(me);
            await this.#sendAuthStatus(true);
            await this.#sendLog('success', "Авторизация", `${me.firstName} ${me.lastName}`);
            await this.#createUserData(`@${me.username}`)
        } catch (e) {
            Log.error(e.message)
            await this.#sendAuthStatus(false);
        }
    }

    async getAuth() {
        let auth = await this.#client.checkAuthorization();
        this.#mainApp.getWindow().webContents.send("checkAuthorization", auth)
    }

    async authQrCode(password) {
        if (!await this.#client.checkAuthorization()) {
            await this.#client.signInUserWithQrCode({apiId: this.#client.apiId, apiHash: this.#client.apiHash}, {
                onError: async (e) => {
                    await this.#sendAuthStatus('error', false, `${e}`);
                    Log.error(e.message)
                    return true;
                }, qrCode: async (code) => {
                    let qr = `tg://login?token=${code.token.toString("base64")}`;
                    this.#mainApp.getWindow().webContents.send("generatedTokenForQRCode", qr)
                }, password: async () => {
                    return password;
                }
            }).then(async (user) => {
                await this.#sendUserData(user)
                await this.#sendAuthStatus(true);
                await this.#sendLog('success', "Авторизация", `${user.firstName} ${user.lastName}`);
                await this.#createUserData(`@${user.username}`)
                await this.#saveSession();
                await this.#loginInQRCode()
            });
        } else {
            const me = await this.#client.getMe();
            await this.#sendUserData(me);
            await this.#sendAuthStatus(true);
            await this.#sendLog('success', "Авторизация", `${me.firstName} ${me.lastName}`);
            await this.#createUserData(`@${me.username}`)
        }
    }

    async loginInPhone(phone, code, password) {
        if (!await this.#client.checkAuthorization()) {
            await this.#client.start({
                phoneNumber: async () => await phone,
                phoneCode: async () => await code,
                password: async () => await password,
                onError: async (err) => {
                    await this.#sendAuthPhoneError("Авторизация по номеру", err)
                    return true;
                },
            }).then(async () => {
                const me = await this.#client.getMe();
                await this.#sendUserData(me)
                await this.#sendAuthStatus(true);
                await this.#sendLog('success', "Авторизация", `${me.firstName} ${me.lastName}`);
                await this.#createUserData(`@${me.username}`)
                await this.#saveSession();
            });
        } else {
            const me = await this.#client.getMe();
            await this.#sendUserData(me)
            await this.#sendAuthStatus(true);
            await this.#sendLog('success', "Авторизация", `${me.firstName} ${me.lastName}`);
            await this.#createUserData(`@${me.username}`)
        }
    }

    async createChat(userList, report = {
        date: undefined,
        incId: undefined,
        pinMessage: undefined,
        description: undefined,
        wiki: []
    }) {
        try {
            //Создать группу
            await this.#setProgressText('Создание группы...')
            await this.#setProgressValue(25)
            //
            let is_names = []
            report.is.forEach(name => is_names.push(name.title))
            //
            let is_name = is_names.join(", ") //.replace(/[(){}\]\[\d]+/gm, "").toString().trim()
            this.#test_title = this.format(new Date()) + " - " + is_name + " - " + report.description + " - " + report.incId
            let test_t = `‼ ${this.#test_title}`
            let test_a = `Создан чат по проблеме ${this.#test_title}`
            const res_cr_chat = await this.#client.invoke(new Api.channels.CreateChannel({
                megagroup: true, title: String(test_t), about: String(test_a),
            }));
            this.#chat_id = res_cr_chat.updates[2].channelId.value;

            //Изменение разрешений группы
            await this.#client.invoke(new Api.messages.EditChatDefaultBannedRights({
                peer: this.#chat_id, bannedRights: new Api.ChatBannedRights({
                    until_date: 0, view_messages: true, change_info: true, invite_users: true, pin_messages: true,
                }),
            }));

            //Получение ссылки на приглашение в чат
            await this.#setProgressText('Получение ссылки на приглашение в чат...')
            await this.#setProgressValue(40)
            const invite_link = await this.#client.invoke(new Api.messages.ExportChatInvite({
                peer: this.#chat_id,
            }));
            let tg_link = invite_link.link;

            let test_test = []
            this.#report_link = []
            // Проверка активации настройки
            if (store.get(SettingsStoreMarks.SETTINGS.atlassian.status)) {
                // Создание отчета
                if (store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status)) {
                    await this.#setProgressText('Создание отчета...')
                    await this.#setProgressValue(50)
                    if (report.wiki.length === 1) {
                        for (const space of report.wiki) {
                            let req = await this.createWikiReport(space, report.date, report.incId);
                            test_test.push(`<b><a href="${req.link}">Ссылка</a></b> на отчет по инциденту`)
                            this.#report_link.push(req.link)
                        }
                    } else {
                        for (const space of report.wiki) {
                            let req = await this.createWikiReport(space, report.date, report.incId);
                            test_test.push(`${req.is} - <b><a href="${req.link}">Ссылка</a></b> на отчет по инциденту`)
                            this.#report_link.push(`${req.is} - ${req.link}`)
                        }
                    }
                }
            }


            //Корректировка сообщения
            await this.#setProgressText('Корректировка сообщения...')
            await this.#setProgressValue(55)
            let message = report.pinMessage.toString().replaceAll("<p>", "").replaceAll("</p>", "").split('\n');
            if (userList.main_users.length === 1 && userList.main_users.filter(users => users.is === 'ОПМПМ ЛК ОИС').length > 0) {
                let resizeMess = message
                message = []
                for (let mess of resizeMess) {
                    if (resizeMess.indexOf(mess) !== 1 && resizeMess.indexOf(mess) !== 2) message.push(mess)
                }
                message.push(`\n<b>Приглашение в оперативный чат:</b> ${tg_link}`)
            } else {
                message[1] = test_test.join("\n")
                message.push(`\n<b>Приглашение в оперативный чат:</b> ${tg_link}`)
            }
            const new_message = message.join('\n')

            //Отправка сообщения
            await this.#setProgressText('Отправка и закрепление сообщения...')
            await this.#setProgressValue(70)
            try {
                await this.#client.sendMessage(this.#chat_id, {
                    message: new_message, parseMode: 'html', linkPreview: false
                }).then(async (e) => {
                    await this.#client.pinMessage(this.#chat_id, e.id, {notify: false})
                })
                let today = new Date();
                await this.#client.sendMessage(this.#chat_id, {
                    message: `В ближайшее время будет произведены архивация и удаление чата`,
                    schedule: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 10, 0).getTime() / 1000
                })
            } catch (e) {
                Log.error(e.message)
                if (e.message.includes("A wait of ")) {
                    await this.#setProgressLogText(e.message)
                } else {
                    await this.#setProgressLogText(e.message)
                }
            }
            //Добавить людей
            await this.#setProgressText('Добавление пользователей в чат...')
            await this.#setProgressValue(85)
            let all_users = []
            const main_users = await this.addUsersToChat(userList.main_users, new_message)
            const production_users = await this.addUsersToChat(userList.production_users, new_message)
            all_users.push(...main_users)
            all_users.push(...production_users)

            if (all_users.length > 0) {
                await this.#client.sendMessage(this.#chat_id, {
                    message: `Люди не добавленные в чат:\n${all_users.join("\n")}\nИм отправлено личное сообщение.`, parseMode: 'html', linkPreview: false
                })
            }

            await this.#setProgressText('Чат успешно создан!')
            await this.#setProgressValue(100)
            await this.#closeDialog()
            await this.#sendNotification(json.description, 'Чат успешно создан!');

            // Проверка активации настройки
            if (store.get(SettingsStoreMarks.SETTINGS.atlassian.status)) {
                // Создание задачи в JIRA
                if (store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status)) await this.createJiraIssue()
            }
        } catch (e) {
            await this.#closeDialog();
            await this.#sendLog('error', `Создание чата`, `${e}`);
            Log.error(e.message);
        }
    }

    async addUsersToChat(list = [], message) {
        //console.log(list)
        let notInvited = []

        for (let users of list) {
            for (let user of Array.from(new Set(users.users))) {
                try {
                    await this.#client.invoke(new Api.channels.InviteToChannel({
                        channel: this.#chat_id, users: [`${user}`],
                    }))
                    await this.#client.invoke(new Api.channels.EditAdmin({
                        channel: this.#chat_id, userId: user, adminRights: new Api.ChatAdminRights({
                            changeInfo: true,
                            postMessages: true,
                            editMessages: true,
                            deleteMessages: true,
                            banUsers: true,
                            inviteUsers: true,
                            pinMessages: true,
                            addAdmins: true,
                            anonymous: false,
                            manageCall: true,
                            other: true,
                        }), rank: "Администратор",
                    }));
                } catch (e) {
                    Log.error(e.message)
                    if (e.message.includes("USER_PRIVACY_RESTRICTED")) {
                        notInvited.push(user)
                        await this.#client.sendMessage(user, {
                            message: message, parseMode: 'html', linkPreview: true
                        })
                    }
                    if (e.message.includes("A wait of ")) {
                        await this.#setProgressLogText(e.message)
                        break
                    } else {
                        await this.#setProgressLogText(`Пользователь с ником ${user} не найден`)
                    }
                }
            }
        }
        return notInvited
    }

    // Создание отчета
    async createWikiReport(wiki = undefined, date = undefined, incId = undefined) {
        //console.log(wiki)
        let domain = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain), "base64").toString("utf-8")
        let username = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.username), "base64").toString("utf-8")
        let password = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.password), "base64").toString("utf-8")
        let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
        // https://wiki.mos-team.ru/
        // Взятие шаблона
        let link_template = `${domain}/rest/api/content/55678859?expand=body.storage`
        let template = await new Promise((resolve, reject) => {
            request.get({url: link_template, headers: {"Authorization": auth}}, async (err, httpResponse, body) => {
                if (err) reject(reject);
                resolve(body)
            });
        });
        // Создание страницы
        let link = `${domain}/rest/api/content/`
        const data = {
            "type": "page",
            "title": `${date} - ${incId} (${wiki.is})`,
            "ancestors": [{"id": wiki.spaces.pageId}],
            "space": {"key": wiki.spaces.space},
            "body": JSON.parse(template).body
        }
        return await new Promise((resolve, reject) => {
            request.post({
                url: link, body: JSON.stringify(data), headers: {"Content-Type": "application/json", "Authorization": auth}
            }, async (err, httpResponse, body) => {
                if (err) reject(reject);
                //console.log(body)
                resolve({
                    is: wiki.is,
                    link: `${domain}/pages/viewpage.action?pageId=${JSON.parse(body).id}`
                })
            });
        });
    }

    // Создание задачи
    async createJiraIssue() {
        let domain = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.domain), "base64").toString("utf-8")
        let username = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.username), "base64").toString("utf-8")
        let password = new Buffer(store.get(SettingsStoreMarks.SETTINGS.atlassian.password), "base64").toString("utf-8")
        let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
        let link = `${domain}/rest/api/2/issue/`
        const data = {
            "fields": {
                //"project": { "key": "DEMO" },
                "project": {"key": "INV"},
                "labels": store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels),
                "priority": {"name": "Highest"},
                "assignee": {"name": username},
                "summary": this.#test_title,
                "description": `Ссылка на отчет:\n${this.#report_link.join("\n")}`, //"issuetype": { "name": "Задача" }
                "issuetype": {"name": "Task"},
                "customfield_16003": {"value": "Другое"}
            }
        }
        request.post({
            url: link, body: JSON.stringify(data), headers: {"Content-Type": "application/json", "Authorization": auth}
        }, async (err, httpResponse, body) => {
            if (err) Log.error(err);
            let issueKey = JSON.parse(body).key;
            await this.#client.sendMessage(this.#chat_id, {
                message: `${domain}/browse/${issueKey}`, parseMode: "html", linkPreview: false
            })
        });
    }

    async logOut() {
        await this.#client.invoke(new Api.auth.LogOut({}));
        if (fs.existsSync(this.#fullSessionPath)) fs.unlinkSync(this.#fullSessionPath);
        this.#mainApp.restart();
    }
}

exports.TelegramSrc = TelegramSrc