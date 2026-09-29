const {
    Page, Button, fs, store, shell, path, TextInput,
    Route, ipcRenderer, Log, ContentBlock, Styles, Icons, Card, Desktop, Stepper, Result, Notification
} = require('chuijs');
const {SettingsStoreMarks} = require("../settings/settings_store_marks");
const {AuthMain} = require("./auth/auth");
const {Tables} = require('../src/google_sheets/tables');

class SettingsGoogleCheckPage extends Page {
    #path_folder = undefined;
    #path_key = undefined;
    #p1 = undefined;
    #main_block = new ContentBlock({
        direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.NOWRAP,
        align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.CENTER
    });
    #b1 = undefined;
    #b2 = undefined;
    #b3 = undefined;

    constructor(MainPage) {
        super();
        this.#path_folder = path.join(String(Desktop.app.path("userData")), "google");
        this.#path_key = path.join(String(this.#path_folder), "credentials.json");
        this.#p1 = MainPage;
        this.#main_block.setWidth(Styles.SIZE.WEBKIT_FILL);
        this.#main_block.setHeight(Styles.SIZE.WEBKIT_FILL);
        this.setTitle('Tools Trin: Настройка и авторизация');
        this.setMain(true);
        this.setFullWidth();
        this.setFullHeight();
        this.add(this.#main_block);
        if (!fs.existsSync(this.#path_folder)) fs.mkdirSync(this.#path_folder);
        let key = store.get(SettingsStoreMarks.SETTINGS.google.json_key_path) === undefined;
        let t1 = store.get(SettingsStoreMarks.SETTINGS.google.tables.users_groups_id) === undefined;
        let t2 = store.get(SettingsStoreMarks.SETTINGS.google.tables.auth_settings_id) === undefined;
        let t3 = store.get(SettingsStoreMarks.SETTINGS.google.tables.services_and_production) === undefined;
        this.#b1 = this.step1Block();
        this.#b2 = this.step2Block();
        this.#b3 = this.step3Block();
        if (key && t1 && t2 && t3) {
            this.#main_block.add(this.#b1);
        } else {
            this.#main_block.add(this.#b3);
        }
    }

    step1Block() {
        const card = new Card({
            id: 'step1Block'
        })
        const result = new Result({
            style: Result.STYLE.ERROR,
            title: "Не установлен ключ доступа к Google.",
            description: 'Нажмите кнопку "Открыть папку" и скопируйте ключ "credentials.json"',
            actions: [new Button({ title: 'Открыть папку', clickEvent: () => shell.openPath(this.#path_folder).then(r => Log.info(r)) })]
        });
        card.add(result);
        let int1 = setInterval(() => {
            if (fs.existsSync(this.#path_key)) {
                result.clearActions()
                result.setTitle("Ключ установлен")
                result.setStyle(Result.STYLE.SUCCESS)
                result.setDescription('Нажмите кнопку "Далее"')
                result.addAction(new Button({
                    title: "Далее",
                    clickEvent: () => {
                        this.#main_block.remove(this.#b1);
                        card.setIcon(Icons.NAVIGATION.CLOSE);
                        card.setTitle("Установите ключи для доступа к таблицам")
                        this.#main_block.add(this.#b2);
                    }
                }))
                clearInterval(int1);
            }
        }, 1);
        return card;
    }

    step2Block() {
        const card = new Card({
            id: 'step2Block',
        })
        let i1 = new TextInput({
            title: 'Идентификатор таблицы: "Группы пользователей"',
            placeholder: 'Группы пользователей',
            width: '400px'
        });
        let i2 = new TextInput({
            title: 'Идентификатор таблицы: "Настройки авторизации"',
            placeholder: 'Настройки авторизации',
            width: '400px'
        });
        let i3 = new TextInput({
            title: 'Идентификатор таблицы: "Сервисы и продакты"',
            placeholder: 'Сервисы и продакты',
            width: '400px'
        });
        let b_save = new Button({
            title: "Сохранить"
        });
        b_save.addClickListener(async () => {
            if (fs.existsSync(this.#path_key) && i1.getValue() !== "" && i2.getValue() !== "" && i3.getValue() !== "") {
                store.set(SettingsStoreMarks.SETTINGS.google.json_key_path, this.#path_key);
                store.set(SettingsStoreMarks.SETTINGS.google.tables.users_groups_id, i1.getValue());
                store.set(SettingsStoreMarks.SETTINGS.google.tables.auth_settings_id, i2.getValue());
                store.set(SettingsStoreMarks.SETTINGS.google.tables.services_and_production, i3.getValue());
                Desktop.app.restart()
            }
            if (i1.getValue() === "") i1.setErrorMessage("Устанвите идентификатор таблицы");
            if (i2.getValue() === "") i2.setErrorMessage("Устанвите идентификатор таблицы");
            if (i3.getValue() === "") i3.setErrorMessage("Устанвите идентификатор таблицы");
        })
        card.add(i1, i2, i3, b_save);
        return card
    }

    step3Block() {
        const tables = {
            t1: new Tables().tableUsersGroups(),
            t2: new Tables().tableAuthSettings(),
            t3: new Tables().tableServicesAndProduction()
        }
        const card = new Card({
            id: 'step3Block'
        })
        const steps = new Stepper({
            orientation: Stepper.ORIENTATION.VERTICAL,
            clickable: false,
            size: Stepper.SIZE.DEFAULT,
            steps: [
                {
                    title: tables.t1.getName(),
                    description: "Электронная таблица Google",
                },
                {
                    title: tables.t2.getName(),
                    description: "Электронная таблица Google",
                },
                {
                    title: tables.t3.getName(),
                    description: "Электронная таблица Google",
                },
                {
                    title: "Запуск",
                    description: "Запуск",
                }
            ]
        });
        setTimeout(async () => {
            const status_1 = await this.checkTable(steps, 1, tables.t1);
            const status_2 = await this.checkTable(steps, 2, tables.t2);
            const status_3 = await this.checkTable(steps, 3, tables.t3);
            if (status_1.status && status_2.status && status_3.status) this.checkAuth();
        }, 200);
        card.add(steps);
        return card
    }

    async checkTable(steps, index, table) {
        const status = await table.getStatus()
        if (status.status) {
            steps.setActive(index)
            Log.info(`Подключение таблице "${table.getName()}" установлено`)
            new Notification({
                title: `Таблица: ${table.getName()}`,
                text: "Подключение установлено",
                style: Notification.STYLE.SUCCESS,
                showTime: 1000
            }).show(false)
        } else {
            Log.error(`Ошибка ${status.error} Таблица: ${table.getName()}`)
            new Notification({
                title: `Таблица: ${table.getName()}`,
                text: `Ошибка подключения: ${status.error}`,
                style: Notification.STYLE.ERROR,
                showTime: 1000
            }).show(false)
        }
        return status;
    }

    checkAuth() {
        ipcRenderer.send("getUser")
        ipcRenderer.on('sendAuthStatus', async (e, status) => {
            if (status) {
                setTimeout(() => new Route().go(this.#p1), 200)
            } else {
                setTimeout(() => new Route().go(new AuthMain(this.#p1)), 200)
            }
        })
    }
}

exports.SettingsGoogleCheckPage = SettingsGoogleCheckPage