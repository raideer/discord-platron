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
    }).spread((item, created) => {
        const hasRole = guild.roles.find('id', item.verifiedRole);

        if (created) {
            console.log('Added guild', guild.name, 'to the database');
        }

        if (!hasRole) {
            guild.createRole({
                name: "PlaTRON Verified",
                color: "BLUE"
            }).then(role => {
                item.verifiedRole = role.id;
                item.save();

                console.log('Created verified role for guild', guild.name, 'as', role.id);
            }).catch(error => {
                if (error.code == 50013) {
                    return console.error('Missing role permissions in guild', guild.name);
                }

                console.error(error);
            });
        } else {
            console.log('Verified role already exists');
        }
    });
}

module.exports = new Listener('guildJoin', exec, {
    emitter: 'client',
    eventName: 'guildCreate'
});
