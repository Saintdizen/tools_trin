const {ContentBlock, Styles, Button, Icons, Label, Page, Route, Card} = require("chuijs");
const {AuthPhone} = require("./auth_phone");
const {AuthQRCode} = require("./auth_qr_code");
const {AuthHelpDialog} = require("../../src/dialogs/dialogs");

class AuthMain extends Page {
    #help_auth_dialog = new AuthHelpDialog();
    #block_main = new ContentBlock({
        direction: Styles.DIRECTION.COLUMN,
        wrap: Styles.WRAP.NOWRAP,
        align: Styles.ALIGN.CENTER,
        justify: Styles.JUSTIFY.CENTER
    });
    #main = new ContentBlock({
        direction: Styles.DIRECTION.COLUMN,
        wrap: Styles.WRAP.NOWRAP,
        align: Styles.ALIGN.CENTER,
        justify: Styles.JUSTIFY.CENTER
    });
    #card = new Card({
        id: 'auth',
        title: 'Авторизация',
        // description: 'Пояснение',
        icon: Icons.ACTIONS.LOGIN
    })

    constructor(mainPage) {
        super();
        this.setTitle('Tools Trin: Авторизация');
        this.setMain(true);
        this.setFullHeight()
        this.setFullWidth()
        this.add(this.#help_auth_dialog)
        this.add(this.#block_main)
        this.#block_main.setWidth(Styles.SIZE.WEBKIT_FILL);
        this.#block_main.setHeight(Styles.SIZE.WEBKIT_FILL);
        this.#block_main.add(this.#card)
        this.#card.add(this.#main)
        this.#main.add(
            new Button({
                title: "По QR-коду",
                icon: Icons.COMMUNICATION.QR_CODE,
                clickEvent: () => new Route().go(new AuthQRCode(this, mainPage))
            }),
            new Button({
                title: "По номеру",
                icon: Icons.COMMUNICATION.PHONE,
                clickEvent: () => new Route().go(new AuthPhone(this, mainPage))
            }),
            new Button({
                title: "Помощь",
                icon: Icons.COMMUNICATION.LIVE_HELP,
                clickEvent: () => this.#help_auth_dialog.open()
            })
        );
    }
}

exports.AuthMain = AuthMain