const {
    Page, Styles, TextInput, PasswordInput, Button, Notification, TextArea, FieldSet, Icons, MenuBar, Route, store, Log, Settings
} = require('chuijs');

//
const {SettingsStoreMarks} = require("../../settings/settings_store_marks");
//

class SettingsMain extends Page {
    #back_page = undefined;
    #b_save = new Button({
        primary: true,
        title: "Сохранить"
    });
    #menuBar = new MenuBar({test: true});
    constructor(page) {
        super();
        this.setTitle('Tools Trin: Настройки');
        this.setMain(false);
        this.setMenuBar(this.#menuBar)
        this.setFullWidth();
        this.setFullHeight();
        this.#back_page = page;

        const back = new Button({
            title: "Назад",
            icon: Icons.NAVIGATION.ARROW_BACK,
            reverse: true,
            clickEvent: () => new Route().go(this.#back_page)
        })

        this.#b_save.setDisabled(true);
        this.#menuBar.addMenuItems(back)

        this.add(this.SettingsApp())
    }

    stringToBase64(string = String()) {
        return new Buffer(string).toString("base64")
    }

    base64ToString(string = String()) {
        return new Buffer(string, "base64").toString("utf-8")
    }

    SettingsApp() {
        // АККАУНТ
        const atlassian_user_name_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.username);
        const atlassian_user_password_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.password);
        //
        const atlassian_user_name = new TextInput({
            name: 'atlassian_user_name', title: "Имя пользователя", placeholder: "Имя пользователя", width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        const atlassian_user_password = new PasswordInput({
            name: 'atlassian_user_password', title: "Пароль", placeholder: "Пароль", width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        //
        if (atlassian_user_name_store !== undefined) atlassian_user_name.setValue(this.base64ToString(atlassian_user_name_store));
        if (atlassian_user_password_store !== undefined) atlassian_user_password.setValue(this.base64ToString(atlassian_user_password_store));
        // Создание задачи
        const atlassian_jira_domain_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.domain);
        const atlassian_jira_create_task_labels_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels);
        //
        const atlassian_jira_domain = new TextInput({
            name: 'atlassian_jira_domain_input', title: "Основной URL JIRA", placeholder: "https://example.ru", width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        const textArea = new TextArea({
            title: "Метки", placeholder: "Метки", width: Styles.SIZE.WEBKIT_FILL, height: "200px",
        })
        //
        if (atlassian_jira_domain_store !== undefined) atlassian_jira_domain.setValue(this.base64ToString(atlassian_jira_domain_store));
        if (atlassian_jira_create_task_labels_store !== undefined) textArea.setValue(atlassian_jira_create_task_labels_store.join("\n"));
        // Создание отчета
        const atlassian_wiki_domain_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain);
        //
        const atlassian_wiki_domain = new TextInput({
            name: 'atlassian_wiki_domain_input', title: "Основной URL WIKI", placeholder: "https://example.ru", width: Styles.SIZE.WEBKIT_FILL, required: true
        });
        //
        if (atlassian_wiki_domain_store !== undefined) atlassian_wiki_domain.setValue(this.base64ToString(atlassian_wiki_domain_store));
        //
        // Статусы чекбоксов
        const atlassian_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.status);
        const atlassian_jira_create_task_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status);
        const atlassian_wiki_create_report_status_store = store.get(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status);
        //
        const settings = new Settings({
            title: 'Настройки',
            description: '',
            sections: [
                Settings.Section({
                    rows: [
                        Settings.ThemeRow({
                            title: 'Оформление'
                        })
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
                                this.#b_save.setDisabled(false)
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
                                this.#b_save.setDisabled(false)
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
                                this.#b_save.setDisabled(false)
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

        this.#b_save.addClickListener(() => {
            try {
                store.set(SettingsStoreMarks.SETTINGS.atlassian.status, settings.getValue("Аккаунт Atlassian"))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.status, settings.getValue("Создание задачи"))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.create_report.status, settings.getValue("Создание отчёта"))

                store.set(SettingsStoreMarks.SETTINGS.atlassian.username, this.stringToBase64(atlassian_user_name.getValue()))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.password, this.stringToBase64(atlassian_user_password.getValue()))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.domain, this.stringToBase64(atlassian_jira_domain.getValue()))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.wiki.domain, this.stringToBase64(atlassian_wiki_domain.getValue()))
                store.set(SettingsStoreMarks.SETTINGS.atlassian.jira.create_task.labels, textArea.getValue().split("\n"))

                new Notification({
                    title: this.getTitle(), text: "Настройки успешно сохранены!", style: Notification.STYLE.SUCCESS, showTime: 2000
                }).show()
            } catch (e) {
                Log.error(`${this.getTitle()} - ${e.message}`)
                new Notification({
                    title: this.getTitle(), text: e.message, style: Notification.STYLE.ERROR, showTime: 2000
                }).show()
            }
            this.#b_save.setDisabled(true)
        })

        this.#menuBar.addMenuItems(this.#b_save)
        return settings
    }
}

exports.SettingsMain = SettingsMain