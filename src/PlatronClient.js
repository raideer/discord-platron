const { AkairoClient } = require('discord-akairo');

const CronHandler = require('./CronHandler');
const Localize = require('localize');
const fs = require('fs');
const winston = require('winston');
const path = require('path');

class PlatronClient extends AkairoClient {
    constructor(options, clientOptions) {
        super(options, clientOptions);

        this.databases = {};
    }

    build() {
        const translations = JSON.parse(fs.readFileSync(path.join(__dirname, '/../translations.json')));
        if (!translations) {
            throw 'Failed to parse translations.json';
        }

        const localize = new Localize(translations, null, 'machine');
        this.localize = localize;

        if (this.akairoOptions.cronDirectory) {
            this.cronHandler = new CronHandler(this, this.akairoOptions);
        } else {
            winston.warn('Cron module is not set up');
        }

        return super.build();
    }

    setDatabase(name, provider) {
        this.databases[name] = provider;
    }

    getDatabase(name) {
        return this.databases[name];
    }

    loadAll() {
        super.loadAll();

        if (this.cronHandler) {
            this.cronHandler.loadAll();
        }
    }

    _(...args) {
        if (!this.localize) return;
        return this.localize.translate.apply(null, args);
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

        if (typeof defaultValue === 'function') {
            return defaultValue.call(this);
        }

        return defaultValue;
    }
}

module.exports = PlatronClient;
