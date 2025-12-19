const {
    Page, Button, Label, fs, store, shell, App, path, TextInput,
    Route, ipcRenderer, Badge, Log, ContentBlock, Styles, Spinner
} = require('chuijs');
const {SettingsStoreMarks} = require("../settings/settings_store_marks");
const {AuthMain} = require("./auth/auth");
const {Tables} = require('../src/google_sheets/tables');

class SettingsGoogleCheckPage extends Page {
    #path_folder = path.join(App.userDataPath(), "google");
    #path_key = path.join(this.#path_folder, "credentials.json");
    #p1 = undefined;
    #main_block = new ContentBlock({
        direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.NOWRAP,
        align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.CENTER
    });
    #b1 = undefined;
    #b2 = undefined;
    constructor(MainPage) {
        super();
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
        if (key && t1 && t2 && t3) {
            this.#main_block.add(this.#b1);
        } else {
            setTimeout(async () => {
                let tables = {
                    t0: "Проверка таблиц",
                    t1: new Tables().tableUsersGroups(),
                    t2: new Tables().tableAuthSettings(),
                    t3: new Tables().tableServicesAndProduction()
                }
                let blocks = {
                    b1: this.addBlock(tables.t1.getName()),
                    b2: this.addBlock(tables.t2.getName()),
                    b3: this.addBlock(tables.t3.getName()),
                }

                let main_block = new ContentBlock({
                    direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.WRAP,
                    align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.CENTER
                });
                main_block.setWidth(Styles.SIZE.WEBKIT_FILL);
                main_block.add(new Label({ text: tables.t0 }), blocks.b1, blocks.b2, blocks.b3);
                this.#main_block.add(main_block)
                let status_1 = await this.checkTable(new Tables().tableUsersGroups(), blocks.b1);
                let status_2 = await this.checkTable(new Tables().tableAuthSettings(), blocks.b2);
                let status_3 = await this.checkTable(new Tables().tableServicesAndProduction(), blocks.b3);
                if (status_1.status && status_2.status && status_3.status) await this.checkAuth();
            }, 200);
        }
    }

    step1Block() {
        let block1 = new ContentBlock({
            direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.NOWRAP,
            align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.CENTER
        });
        let label1 = new Label({markdownText: "Не установлен ключ доступа к Google"});
        let label2 = new Label({markdownText: "Нажмите кнопку **Открыть папку** и скопируйте ключ **credentials.json**"});
        block1.add(label1, label2);
        let b_open_path = new Button({title: "Открыть папку"});
        b_open_path.addClickListener(() => shell.openPath(this.#path_folder).then(r => Log.info(r)));
        block1.add(b_open_path);
        let int1 = setInterval(() => {
            if (fs.existsSync(this.#path_key)) {
                block1.remove(b_open_path);
                label1.setMarkdownText("Ключ установлен")
                label2.setMarkdownText("Нажмите кнопку **Далее**")
                let b_next = new Button({title: "Далее"});
                block1.add(b_next);
                b_next.addClickListener(() => {
                    this.#main_block.remove(this.#b1);
                    this.#main_block.add(this.#b2);
                })
                clearInterval(int1);
            }
        }, 1);
        return block1;
    }

    step2Block() {
        let block2 = new ContentBlock({
            direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.NOWRAP,
            align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.CENTER
        });
        let label1 = new Label({markdownText: "Установите ключи для доступа к таблицам"});
        block2.add(label1);
        let i1 = new TextInput({title: 'Идентификатор таблицы: "Группы пользователей"', placeholder: 'Группы пользователей', width: '400px'});
        let i2 = new TextInput({title: 'Идентификатор таблицы: "Настройки авторизации"', placeholder: 'Настройки авторизации', width: '400px'});
        let i3 = new TextInput({title: 'Идентификатор таблицы: "Сервисы и продакты"', placeholder: 'Сервисы и продакты', width: '400px'});
        block2.add(i1, i2, i3);
        let b_save = new Button({title: "Сохранить"});
        b_save.addClickListener(async () => {
            if (fs.existsSync(this.#path_key) && i1.getValue() !== "" && i2.getValue() !== "" && i3.getValue() !== "") {
                store.set(SettingsStoreMarks.SETTINGS.google.json_key_path, this.#path_key);
                store.set(SettingsStoreMarks.SETTINGS.google.tables.users_groups_id, i1.getValue());
                store.set(SettingsStoreMarks.SETTINGS.google.tables.auth_settings_id, i2.getValue());
                store.set(SettingsStoreMarks.SETTINGS.google.tables.services_and_production, i3.getValue());
                let apps = App.get();
                apps.relaunch()
                apps.exit(0)
            }
            if (i1.getValue() === "") i1.setErrorMessage("Устанвите идентификатор таблицы");
            if (i2.getValue() === "") i2.setErrorMessage("Устанвите идентификатор таблицы");
            if (i3.getValue() === "") i3.setErrorMessage("Устанвите идентификатор таблицы");
        })
        block2.add(b_save);
        return block2;
    }

    addBlock(text) {
        let block = new ContentBlock({
            direction: Styles.DIRECTION.ROW, wrap: Styles.WRAP.WRAP,
            align: Styles.ALIGN.CENTER, justify: Styles.JUSTIFY.SPACE_BEETWEEN
        });
        block.setWidth("47%");
        block.setHeight("50px")
        block.add(new Label({
            markdownText: text, wordBreak: Styles.WORD_BREAK.BREAK_ALL
        }))
        return block;
    }

    async checkTable(table, block) {
        let spinner = new Spinner(Spinner.SIZE.SMALL, "0px 85px 0px 0px")
        block.add(spinner)
        let status = await table.getStatus()
        if (status.status) {
            block.remove(spinner)
            setTimeout(() => {
                block.add(new Badge({text: "Соединение установлено", style: Badge.STYLE.SUCCESS}))
            }, 150)
            Log.info(`Подключение таблице "${table.getName()}" установлено`)
        } else {
            block.remove(spinner)
            setTimeout(() => {
                block.add(new Badge({text: "Соединение не установлено", style: Badge.STYLE.ERROR}))
            }, 150)
            Log.error(`Ошибка ${status.error} Таблица: ${table.getName()}`)
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