const { AkairoClient } = require('discord-akairo');

const CronHandler = require('./CronHandler');
const Localize = require('localize');
const fs = require('fs');
const winston = require('winston');
const path = require('path');
const _ = require('lodash');
const PlatronUtils = require('./utils');
class PlatronClient extends AkairoClient {
    constructor(options, clientOptions) {
        super(options, clientOptions);

        this.databases = {};
        this.platron_utils = new PlatronUtils(this);
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

        super.build();

        this._addCitizenIdType();

        return this;
    }

    async guildConfig(guild, key, defaultValue = null) {
        const Config = this.databases.config.table;
        const val = await Config.findOrCreate({
            where: {
                field: key,
                guild_id: guild.id
            },
            defaults: {
                value: defaultValue
            }
        });

        return _.first(val).value;
    }

    _addCitizenIdType() {
        this.commandHandler.resolver.addType('citizenId', async (word, message) => {
            const id = await this.platron_utils.resolveCitizenId(word, message.author.id, message.guild);
            return id;
        });
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
