const { Listener } = require('discord-akairo');
const winston = require('winston');

async function exec(guild) {
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

module.exports = new Listener('guildJoin', exec, {
    emitter: 'client',
    eventName: 'guildCreate'
});
