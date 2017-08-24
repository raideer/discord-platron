const { Listener } = require('discord-akairo');


function exec(guild) {
    console.log('Joined guild', guild.name);
    const Guild = this.client.databases.guilds.table;

    Guild.findOrCreate({
        where: {
            id: guild.id
        },
        defaults: {
            id: guild.id,
            prefix: "!",
            locale: "en"
        }
    });
}

module.exports = new Listener('guildJoin', exec, {
    emitter: 'client',
    eventName: 'guildCreate'
});
