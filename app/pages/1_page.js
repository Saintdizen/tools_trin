const {
    Page, Button, TextInput, ContentBlock,
    Styles, Notification, ipcRenderer, Dialog,
    ProgressBar, Label, Spinner,
    TextEditor, MenuBar, Icons, Log, Popup, ComboBox, MultiComboBox
} = require('chuijs');
const {CreateHelpDialog} = require("../src/dialogs/dialogs");
const {Tables} = require('../src/google_sheets/tables');
let tableUsersGroups = new Tables().tableUsersGroups();
let tableAuthSettings = new Tables().tableAuthSettings();
let tableServicesAndProduction = new Tables().tableServicesAndProduction();

let list_users = {
    main_users: [],
    production_users: []
};
let report = {
    date: String(undefined),
    incId: String(undefined),
    pinMessage: String(undefined),
    description: String(undefined),
    is: String(undefined),
    service: String(undefined),
    wiki: []
}

//
class CreateChatTG extends Page {
    //#spinner_big = new Spinner(Spinner.SIZE.BIG, '10px');
    #help_create_dialog = new CreateHelpDialog();
    #menuBar = new MenuBar({test: true});
    #comboBox_services_Options = []
    constructor() {
        super();
        // Настройки страницы
        this.setTitle('Tools Trin: Создание чата в Telegram');
        this.setMain(true);
        this.setFullWidth();
        this.setFullHeight();
        this.#enableLogsNotification();
        this.add(this.#help_create_dialog)
        this.#menuBar = new MenuBar({test: true});
        this.setMenuBar(this.#menuBar)
        this.add(this.#mainBlock())
    }



    #mainBlock() {
        let block = new ContentBlock({
            direction: Styles.DIRECTION.COLUMN,
            wrap: Styles.WRAP.WRAP,
            align: Styles.ALIGN.CENTER,
            justify: Styles.JUSTIFY.START
        });
        block.setWidth("-webkit-fill-available")
        //
        let main_block_1 = new ContentBlock({
            direction: Styles.DIRECTION.ROW,
            wrap: Styles.WRAP.WRAP,
            align: Styles.ALIGN.CENTER,
            justify: Styles.JUSTIFY.CENTER
        });
        main_block_1.setWidth(Styles.SIZE.WEBKIT_FILL);
        //
        let progressBlock = new ContentBlock({
            direction: Styles.DIRECTION.COLUMN,
            wrap: Styles.WRAP.WRAP,
            align: Styles.ALIGN.CENTER,
            justify: Styles.JUSTIFY.CENTER
        });
        progressBlock.setWidth("-webkit-fill-available")
        progressBlock.disableMarginChild();
        //
        let modal = new Dialog({
            width: "80%",
            height: "max-content",
        })
        //
        let progressBar = new ProgressBar({max: 100});
        progressBar.setWidth("-webkit-fill-available")
        progressBar.setValue(0)
        //
        let spinner = new Spinner(Spinner.SIZE.SMALL, '8px auto');
        //
        let comboBox_services = new MultiComboBox({
            name: "Сервисы",
            title: "Сервисы",
            placeholder: "Сервисы",
            width: Styles.SIZE.WEBKIT_FILL,
            transparentBack: false,
            optionsLen: 10
        })
        comboBox_services.setDisabled(true)
        //
        let comboBox_is_Options = []
        let comboBox_is = new MultiComboBox({
            name: "ИС",
            title: "ИС",
            placeholder: "ИС",
            width: Styles.SIZE.WEBKIT_FILL,
            transparentBack: false,
            optionsLen: 5
        })
        // Номер инцидента
        let inc_num = new TextInput({
            title: 'Номер инцидента',
            placeholder: 'Номер инцидента',
            width: '-webkit-fill-available',
            required: false
        });
        inc_num.setValue('IM')
        // Описение инцидента
        let desc = new TextInput({
            title: 'Описание инцидента',
            placeholder: 'Описание инцидента',
            width: '-webkit-fill-available',
            required: false
        });
        // Закрепленное сообщение
        let pin_message = new TextEditor(Styles.SIZE.WEBKIT_FILL, {
            title: "Закрепленное сообщение",
            controls: {
                UNDO_REDO: true,
                BLOCK_FORMAT: false,
                FONT_SIZE: false,
                REMOVE_FORMAT: false,
                BOLD: true,
                ITALIC: true,
                STRIKE_THROUGH: true,
                UNDERLINE: true,
                SUBSCRIPT: false,
                SUPERSCRIPT: false,
                JUSTIFY_LEFT: false,
                JUSTIFY_CENTER: false,
                JUSTIFY_RIGHT: false,
                JUSTIFY_FULL: false,
                LISTS: false,
                INSERT_LINK: false,
                INSERT_TABLE: false,
                INSERT_IMAGE: false,
                LINE_BREAK: false,
                CONTENT_CONTROLS: false
            }
        })
        pin_message.setValueAsHTML("<p><b>Описание инцидента:</b></p>\n" +
            "<p>--- Данная строка будет автоматически изменена ---</p>\n" +
            "<p><b>Статус подготовки отчета:</b> Заполнение отчёта</p>\n" +
            "<p><b>Ответственный:</b> Определение ответственного</p>\n" +
            "<p><b><br></b></p>\n" +
            "<p><b>Время начала:</b></p>\n" +
            "<p><b>Время окончания:</b></p>\n" +
            "<p><b>Статус:</b> ⚠️ Устранение инцидента</p>")
        // Кнопка закрытия модала
        let button_close = new Button({
            title: "Закрыть",
            clickEvent: () => {
                modal.close()
                progressBar.setProgressText("")
                progressBar.setValue(0)
            }
        })
        // Кнопка создания чата
        let pop = new Popup();
        inc_num.addInputListener(() => button_c_clear.setDisabled(false))
        desc.addInputListener(() => button_c_clear.setDisabled(false))
        pin_message.addInputListener(() => button_c_clear.setDisabled(false))
        //pin_message.addInputListener(() => button_c_clear.setDisabled(false))
        let button_c_clear = new Button({
            title: "Очистить",
            clickEvent: async () => {
                //
                list_users.main_users = []
                list_users.production_users = []
                comboBox_services.clear()
                comboBox_services.setDisabled(true)
                comboBox_is.clear()
                report.wiki = []
                report.is = undefined
                report.service = undefined
                report.date = undefined
                report.incId = undefined
                report.pinMessage = undefined
                report.description = undefined
                //
                inc_num.setValue('IM')
                //
                desc.setValue("")
                //
                pin_message.setValueAsHTML("<p><b>Описание инцидента:</b></p>\n" +
                    "<p>--- Данная строка будет автоматически изменена ---</p>\n" +
                    "<p><b>Статус подготовки отчета:</b> Заполнение отчёта</p>\n" +
                    "<p><b>Ответственный:</b> Определение ответственного</p>\n" +
                    "<p><b><br></b></p>\n" +
                    "<p><b>Время начала:</b></p>\n" +
                    "<p><b>Время окончания:</b></p>\n" +
                    "<p><b>Статус:</b> ⚠️ Устранение инцидента</p>")
                button_c_chat.setDisabled(true);
                new Notification({
                    title: 'Создание чата', text: "Форма очищена!",
                    style: Notification.STYLE.SUCCESS, showTime: 3000
                }).show()
                button_c_clear.setDisabled(true)
            }
        })
        button_c_clear.setDisabled(true)
        let button_c_chat = new Button({
            primary: true,
            title: "Создать чат",
            clickEvent: async () => {
                let confirm_res = await pop.confirm({
                    title: 'Создание чата',
                    message: 'Продолжить?',
                    okText: 'OK', cancelText: 'Отмена',
                })
                if (confirm_res) {
                    if (list_users.length !== 0) {
                        modal.open()
                        progressBar.setProgressText('Получение данных...')
                        report.date = CreateChatTG.#format(new Date());
                        report.incId = inc_num.getValue();
                        report.pinMessage = pin_message.getValueAsHTML();
                        report.description = desc.getValue();
                        report.is = comboBox_is.getValue();
                        report.service = comboBox_services.getValue()
                        try {
                            ipcRenderer.on('setProgressValue', (e, value) => progressBar.setValue(value))
                            ipcRenderer.on('setProgressText', (e, text) => progressBar.setProgressText(text))
                            ipcRenderer.on('setProgressLogText', (e, text) => progressBlock.add(new Label(text)))
                            ipcRenderer.send('tg_crt_chat', list_users, report)
                        } catch (e) {
                            Log.error(e.message)
                            progressBlock.add(new Label(e.message))
                            new Notification({
                                title: 'Создание чата', text: e.message,
                                style: Notification.STYLE.ERROR, showTime: 3000
                            }).show()
                        }
                    } else {
                        new Notification({
                            title: 'Создание чата', text: 'Выберите список пользователей',
                            style: Notification.STYLE.ERROR, showTime: 3000
                        }).show()
                    }
                }
            }
        })
        button_c_chat.setDisabled(true);
        //
        let button_help = new Button({
            title: "Помощь",
            icon: Icons.COMMUNICATION.LIVE_HELP,
            clickEvent: () => this.#help_create_dialog.open()
        })
        //
        this.#menuBar.addMenuItems(button_help, button_c_chat, button_c_clear)
        //
        progressBlock.add(progressBar)
        modal.addToBody(progressBlock)
        block.add(modal)
        main_block_1.add(spinner)
        //

        ipcRenderer.on("sendNotification", (e, text, body) => {
            new Notification({
                title: text, text: body,
                style: Notification.STYLE.SUCCESS, showTime: 3000
            }).show(true)
        })

        ipcRenderer.on('user_data', async (e, TAG_TG, ROLE, GROUP) => {
            //
            let services = await tableServicesAndProduction.getLists();
            for (const sheet of services.data.sheets) {
                const title_sheet = sheet.properties.title
                if (title_sheet.includes("SERVICES_")) {
                    let serv = await this.#getServices(title_sheet)
                    this.#comboBox_services_Options.push(serv)
                }
            }
            comboBox_services.addOptionsWithSections(this.#comboBox_services_Options)
            //
            comboBox_services.addValueChangeListener((e) => {
                list_users.production_users = []
                //
                for (let user of e.detail.values) {
                    list_users.production_users.push({
                        service: user.option.title,
                        users: user.option.value.split("\n")
                    })
                }
                //
                new Notification({
                    title: 'Список пользователей', text: "Дополнен",
                    style: Notification.STYLE.SUCCESS, showTime: 3000
                }).show()
            })
            //
            let rp_names = await tableUsersGroups.getLists().catch(err => Log.info(err.message));
            for (let list of rp_names.data.sheets) {
                comboBox_is_Options.push({title: list.properties.title, value: list.properties.title});
            }
            comboBox_is.addOptions(...comboBox_is_Options)
            comboBox_is.addValueChangeListener(async (e) => {
                this.#comboBox_services_Options = []
                let var1 = e.detail.values.filter((val) => {
                    return val.title.includes("ОПМПМ Первый") || val.title.includes("ОПМПМ Второй") || val.title.includes("МПММ 1.0") || val.title.includes("МПММ 2.0") || val.title.includes("Тестовая ИС")
                })
                if (var1.length > 0) {
                    comboBox_services.clear()
                    comboBox_services.setDisabled(false)
                } else {
                    comboBox_services.clear()
                    comboBox_services.setDisabled(true)
                }
                //
                try {
                    button_c_chat.setDisabled(true);
                    button_c_clear.setDisabled(true);
                    // Чтение таблиц
                    let report_list = await tableAuthSettings.read(`REPORTS!A1:D`);
                    let goog_users_list = []
                    let goog_report_list = []
                    for (let table of e.detail.values) {
                        let test = await tableUsersGroups.read(`${table.title}!A1:A`).catch(err => Log.error(err.message))
                        let cache = []
                        test.forEach(user => cache.push(user[0]))
                        goog_users_list.push({
                            is: table.title,
                            users: cache
                        })

                        report_list.filter(val => {
                            if (table.title.includes(val[1])) {
                                goog_report_list.push({
                                    is: table.title,
                                    spaces: {
                                        space: val[2],
                                        pageId: val[3]
                                    }
                                })
                            }
                        })
                    }
                    report.wiki = goog_report_list
                    list_users.main_users = goog_users_list
                    new Notification({
                        title: 'Список пользователей', text: "Обновлен",
                        style: Notification.STYLE.SUCCESS, showTime: 3000
                    }).show()
                    button_c_chat.setDisabled(false);
                    button_c_clear.setDisabled(false);
                } catch (e) {
                    Log.error(e.message);
                    new Notification({
                        title: 'Список пользователей', text: e,
                        style: Notification.STYLE.ERROR, showTime: 3000
                    }).show();
                }
            })
            main_block_1.clear()
            main_block_1.add(comboBox_is, comboBox_services)
        })
        modal.addToFooter(button_close)
        //Добавление компонентов на форму
        block.add(main_block_1, inc_num, desc, pin_message) //, button_c_chat)
        return block;
    }

    async #getServices(name = String()) {
        let options_test = []
        let test = await tableServicesAndProduction.read(`${name}!A1:B`).catch(err => Log.error(err.message));
        let people = undefined
        for (let tt of test) {
            if (!String(tt[0]).includes("---")) {
                if (tt[1] !== undefined) people = tt[1]
                if (tt[0] !== undefined) {
                    options_test.push({title: tt[0], value: people})
                }
            }
        }
        return { title: name.replace("SERVICES_", ""), options: options_test }
    }

    #enableLogsNotification() {
        ipcRenderer.on('sendLog', (e, type, title, message) => {
            if (type === "success") {
                new Notification({
                    title: title,
                    text: message,
                    style: Notification.STYLE.SUCCESS,
                    showTime: 3000
                }).show()
            } else if (type === 'error') {
                Log.error(`${title} - ${message}`)
                new Notification({title: title, text: message, style: Notification.STYLE.ERROR, showTime: 3000}).show()
            } else if (type === undefined) {
                Log.info(`${title} - ${message}`)
                new Notification({title: title, text: message, showTime: 3000}).show()
            }
        })
    }

    static #format(date) {
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        //Определение дня и месяца
        if (day < 10) day = "0" + day;
        if (month < 10) month = "0" + month;
        return String(day + "-" + month + "-" + year);
    }
}

exports.CreateChatTG = CreateChatTG