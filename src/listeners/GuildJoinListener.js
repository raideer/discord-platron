const { Listener } = require('discord-akairo');
const winston = require('winston');

module.exports = class GuildJoinListener extends Listener {
    constructor() {
        super('guildJoin', {
            emitter: 'client',
            eventName: 'guildCreate'
        });
    }

    async exec(guild) {
        winston.info('Joined guild', guild.name);

        await this.client.settings.set(guild, 'prefix', '!', 'string', false);
        await this.client.settings.set(guild, 'locale', 'en', 'string', false);
    }
};
