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

    resolveValue(value, type, guild) {
        switch (type) {
        case 'number': {
            return Number(value);
        }
        case 'boolean': {
            return value == 'true' || value == '1';
        }
        case 'false': {
            return value == 'false' || value == '0';
        }
        case 'role': {
            return guild.client.util.resolveRole(value, guild.roles);
        }
        case 'channel': {
            return guild.client.util.resolveChannel(value, guild.channels);
        }
        case 'string': {
            return String(value);
        }
        default: {
            return null;
        }
        }
    }

    get(guild, setting, def) {
        const value = super.get(`${setting}:${guild.id}`, 'data');

        if (!value) {
            return def;
        }

        const match = String(value).match(/^(string|number|boolean):(.+)$/);

        if (match) {
            return this.resolveValue(match[2], match[1], guild);
        }

        return value;
    }
};
