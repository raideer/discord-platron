const { SequelizeProvider } = require('discord-akairo');
const winston = require('winston');
require('colors');

module.exports = class SettingsProvider extends SequelizeProvider {
    constructor(table) {
        super(table, {
            idColumn: 'name'
        });
    }

    async set(guild, setting, value, type = 'string', override = true) {
        if (!override && this.has(guild, setting)) {
            return;
        }

        await super.set(`${setting}:${guild.id}`, 'data', `${type}:${value}`);
        winston.info(`[${String(guild.id).cyan}] ${setting} was set to ${value}`);
    }

    clear(guild, setting) {
        super.clear(`${setting}:${guild.id}`);
    }

    has(guild, setting) {
        return !!super.get(`${setting}:${guild.id}`, 'data');
    }

    get(guild, setting, def) {
        const value = super.get(`${setting}:${guild.id}`, 'data');

        if (!value) {
            return def;
        }

        const match = String(value).match(/^(string|number|boolean):(.+)$/);

        if (match) {
            switch (match[1]) {
            case 'number': {
                return Number(match[2]);
            }
            case 'boolean': {
                return match[2] == 'true' || match[2] == '1';
            }
            default: {
                return match[2];
            }
            }
        }

        return value;
    }
};
