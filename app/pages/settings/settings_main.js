const {
    Page,
    ContentBlock,
    Styles,
    TextInput,
    PasswordInput,
    Button,
    Notification,
    CheckBox,
    TextArea,
    FieldSet,
    Icons,
    MenuBar,
    Route,
    store, Log, Settings
} = require('chuijs');

//
const {SettingsStoreMarks} = require("../../settings/settings_store_marks");
//

class SettingsMain extends Page {
    #back_page = undefined;
    #menuBar = new MenuBar({test: true});
    constructor(page) {
        super();
        this.setTitle('Tools Trin: Настройки');
        this.setMain(false);
        this.setMenuBar(this.#menuBar)
        this.setFullWidth();
        this.#back_page = page;

        let back = new Button({
            title: "Назад",
            icon: Icons.NAVIGATION.ARROW_BACK,
            reverse: true,
            clickEvent: () => new Route().go(this.#back_page)
        })

        this.#menuBar.addMenuItems(back)

        this.add(this.SettingsApp())
    }

    SettingsApp() {
        //
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.status, false)
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.username, new Buffer(atlassian_user_name.getValue()).toString("base64"))
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.password, new Buffer(atlassian_user_password.getValue()).toString("base64"))
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.domain, new Buffer(atlassian_jira_domain.getValue()).toString("base64"))
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain, new Buffer(atlassian_wiki_domain.getValue()).toString("base64"))
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status, createTask_check.getValue())
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels, textArea.getValue().split("\n"))
        // store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status, createReport_check.getValue())
        // АККАУНТ
        let atlassian_user_name_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.username);
        let atlassian_user_password_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.password);
        //
        let atlassian_user_name = new TextInput({
            name: 'atlassian_user_name', title: "Имя пользователя", placeholder: "Имя пользователя",
            width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        let atlassian_user_password = new PasswordInput({
            name: 'atlassian_user_password', title: "Пароль", placeholder: "Пароль",
            width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        //
        if (atlassian_user_name_store !== undefined) atlassian_user_name.setValue(new Buffer(atlassian_user_name_store, "base64").toString("utf-8"));
        if (atlassian_user_password_store !== undefined) atlassian_user_password.setValue(new Buffer(atlassian_user_password_store, "base64").toString("utf-8"));
        // Создание задачи
        let atlassian_jira_domain_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.domain);
        let atlassian_jira_create_task_labels_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels);
        //
        let atlassian_jira_domain = new TextInput({
            name: 'atlassian_jira_domain_input', title: "Основной URL JIRA", placeholder: "https://example.ru",
            width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        let textArea = new TextArea({
            title: "Метки",
            placeholder: "Метки",
            width: Styles.SIZE.WEBKIT_FILL, height: "200px",
        })
        //
        if (atlassian_jira_domain_store !== undefined) atlassian_jira_domain.setValue(new Buffer(atlassian_jira_domain_store, "base64").toString("utf-8"));
        if (atlassian_jira_create_task_labels_store !== undefined) textArea.setValue(atlassian_jira_create_task_labels_store.join("\n"));
        // Создание отчета
        let atlassian_wiki_domain_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain);
        //
        let atlassian_wiki_domain = new TextInput({
            name: 'atlassian_wiki_domain_input', title: "Основной URL WIKI", placeholder: "https://example.ru",
            width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        //
        if (atlassian_wiki_domain_store !== undefined) atlassian_wiki_domain.setValue(new Buffer(atlassian_wiki_domain_store, "base64").toString("utf-8"));
        //
        // Статусы чекбоксов
        let atlassian_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.status);
        let atlassian_jira_create_task_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status);
        let atlassian_wiki_create_report_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status);
        //
        const settings = new Settings({
            title: 'Настройки',
            description: '',
            sections: [
                Settings.Section({
                    rows: [
                        Settings.ThemeRow({ title: 'Оформление' })
                    ],
                }),
                Settings.Section({
                    rows: [
                        Settings.ToggleRow({
                            title: "Аккаунт Atlassian",
                            value: atlassian_status_store,
                            onChange: (e) => {
                                store.set(SettingsStoreMarks.SETTINGS.atlassian.status, e.target.checked);
                                if (e.target.checked) {
                                    atlassian_user_name.setDisabled(false);
                                    atlassian_user_password.setDisabled(false);
                                    settings.setRowDisabled("Создание задачи", false)
                                    settings.setRowDisabled("Создание отчёта", false)
                                } else {
                                    atlassian_user_name.setDisabled(true);
                                    atlassian_user_password.setDisabled(true);
                                    settings.setRowDisabled("Создание задачи", true)
                                    settings.setRowDisabled("Создание отчёта", true)
                                }
                                new Notification({
                                    title: "Аккаунт Atlassian",
                                    text: "Настройки успешно сохранены!",
                                    style: Notification.STYLE.SUCCESS,
                                    showTime: 2000
                                }).show()
                            }
                        }),
                        Settings.Row({control: atlassian_user_name, stretch: true, disabled: false }),
                        Settings.Row({control: atlassian_user_password, stretch: true, disabled: false }),
                        // Создание задачи
                        Settings.ToggleRow({
                            title: "Создание задачи",
                            value: atlassian_jira_create_task_status_store,
                            onChange: (e) => {
                                store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status, e.target.checked);
                                if (e.target.checked) {
                                    atlassian_jira_domain.setDisabled(false);
                                    textArea.setDisabled(false);
                                } else {
                                    atlassian_jira_domain.setDisabled(true);
                                    textArea.setDisabled(true);
                                }
                                new Notification({
                                    title: "Создание задачи",
                                    text: "Настройки успешно сохранены!",
                                    style: Notification.STYLE.SUCCESS,
                                    showTime: 2000
                                }).show()
                            },
                            disabled: false
                        }),
                        Settings.Row({control: atlassian_jira_domain, stretch: true, disabled: false }),
                        Settings.Row({control: textArea, stretch: true, disabled: false }),
                        //
                        Settings.ToggleRow({
                            title: "Создание отчёта",
                            value: atlassian_wiki_create_report_status_store,
                            onChange: (e) => {
                                store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status, e.target.checked);
                                if (e.target.checked) {
                                    atlassian_wiki_domain.setDisabled(false);
                                } else {
                                    atlassian_wiki_domain.setDisabled(true);
                                }
                                new Notification({
                                    title: "Создание отчёта",
                                    text: "Настройки успешно сохранены!",
                                    style: Notification.STYLE.SUCCESS,
                                    showTime: 2000
                                }).show()
                            }
                        }),
                        Settings.Row({control: atlassian_wiki_domain, stretch: true, disabled: false }),
                    ],
                })
            ],
        });
        //
        if (atlassian_status_store) {
            atlassian_user_name.setDisabled(false);
            atlassian_user_password.setDisabled(false);
            settings.setRowDisabled("Создание задачи", false)
            settings.setRowDisabled("Создание отчёта", false)
        } else {
            atlassian_user_name.setDisabled(true);
            atlassian_user_password.setDisabled(true);
            settings.setRowDisabled("Создание задачи", true)
            settings.setRowDisabled("Создание отчёта", true)
        }
        //
        if (atlassian_jira_create_task_status_store) {
            atlassian_jira_domain.setDisabled(false);
            textArea.setDisabled(false);
        } else {
            atlassian_jira_domain.setDisabled(true);
            textArea.setDisabled(true);
        }
        //
        if (atlassian_wiki_create_report_status_store) {
            atlassian_wiki_domain.setDisabled(false);
        } else {
            atlassian_wiki_domain.setDisabled(true);
        }
        //
        let b_cancel = new Button({
            title: "Отмена", clickEvent: () => new Route().go(this.#back_page)
        });
        let b_save = new Button({
            primary: true,
            title: "Сохранить", clickEvent: () => {
                try {
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.status, activateAtlassian_check.getValue())
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status, createTask_check.getValue())
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status, createReport_check.getValue())

                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.username, new Buffer(atlassian_user_name.getValue()).toString("base64"))
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.password, new Buffer(atlassian_user_password.getValue()).toString("base64"))
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.domain, new Buffer(atlassian_jira_domain.getValue()).toString("base64"))
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain, new Buffer(atlassian_wiki_domain.getValue()).toString("base64"))
                    // store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels, textArea.getValue().split("\n"))


                    let main_rows = settings.getSections()[1].rows;
                    for (let row of main_rows) {
                        let elem = row.control
                        console.log(elem);
                    }

                    new Notification({
                        title: this.getTitle(),
                        text: "Настройки успешно сохранены!",
                        style: Notification.STYLE.SUCCESS,
                        showTime: 2000
                    }).show()
                } catch (e) {
                    Log.error(`${this.getTitle()} - ${e.message}`)
                    new Notification({
                        title: this.getTitle(), text: e.message, style: Notification.STYLE.ERROR, showTime: 2000
                    }).show()
                }
            }
        });

        this.#menuBar.addMenuItems(b_cancel, b_save)
        //
        return new FieldSet({
            style: {
                direction: Styles.DIRECTION.COLUMN, wrap: Styles.WRAP.NOWRAP,
                width: Styles.SIZE.WEBKIT_FILL
            },
            components: [settings]
        })
    }
}

exports.SettingsMain = SettingsMain