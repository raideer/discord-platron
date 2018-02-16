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

        const Guild = this.client.databases.guilds.table;

        await Guild.findOrCreate({
            where: {
                id: guild.id
            },
            defaults: {
                id: guild.id,
                prefix: '!',
                locale: 'en'
            }
        });
    }
};
