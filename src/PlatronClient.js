const { AkairoClient } = require('discord-akairo');

const CronHandler = require('./CronHandler');
const AutoRoleHandler = require('./AutoRoleHandler');
const Localize = require('localize');
const fs = require('fs');
const winston = require('winston');

class PlatronClient extends AkairoClient {
    build() {
        const translations = JSON.parse(fs.readFileSync(__dirname + '/../translations.json'));
        if (!translations) {
            throw "Failed to parse translations.json";
        }

        const localize = new Localize(translations, null, 'machine');
        this.localize = localize;

        if (this.akairoOptions.cronDirectory) {
            this.cronHandler = new CronHandler(this, this.akairoOptions);
        } else {
            winston.warn('Cron module is not set up');
        }

        if (this.akairoOptions.rolesDirectory) {
            this.roleHandler = new AutoRoleHandler(this, this.akairoOptions);
        } else {
            winston.warn('Auto role module is not set up');
        }

        return super.build();
    }

    loadAll() {
        super.loadAll();

        if (this.cronHandler) {
            this.cronHandler.loadAll();
        }

        if (this.roleHandler) {
            this.roleHandler.loadAll();
        }
    }

    _() {
        return this.localize.translate.apply(null, arguments);
    }

    env(key, defaultValue = null) {
        if (process.env[key]) {
            if (process.env[key] == 'true') {
                return true;
            } else if (process.env[key] == 'false') {
                return false;
            }

            return process.env[key];
        }

        if (typeof defaultValue == 'function') {
            return defaultValue.call(this);
        }

        return defaultValue;
    }
}

module.exports = PlatronClient;
