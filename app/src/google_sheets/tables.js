const {store} = require('chuijs');
const {GoogleSheets} = require('./google_sheets');
const {SettingsStoreMarks} = require("../../settings/settings_store_marks");

class Tables {
    #users_groups_id = undefined;
    #auth_settings_id = undefined;
    #services_and_production = undefined;
    constructor() {
        this.#users_groups_id = store.get(SettingsStoreMarks.SETTINGS.google.tables.users_groups_id);
        this.#auth_settings_id = store.get(SettingsStoreMarks.SETTINGS.google.tables.auth_settings_id);
        this.#services_and_production = store.get(SettingsStoreMarks.SETTINGS.google.tables.services_and_production);
    }
    tableUsersGroups() {
        return new GoogleSheets(String(this.#users_groups_id), "Группы пользователей");
    }
    tableAuthSettings() {
        return new GoogleSheets(String(this.#auth_settings_id), "Настройки авторизации");
    }
    tableServicesAndProduction() {
        return new GoogleSheets(String(this.#services_and_production), "Сервисы и продакты");
    }
}

exports.Tables = Tables