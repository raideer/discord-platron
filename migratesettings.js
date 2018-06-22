const db = require('./db/models/index');

function getFieldType(name) {
    switch(name) {
        case 'setVerifiedRoles':
        case 'setPartyRoles':
        case 'setCongressRoles':
        case 'setDivisionRoles':
        case 'setMURoles':
        case 'autoDeleteMessages':
        case 'enableCommands':
        case 'setCountryRoles':
            return 'boolean';
        default:
            return 'string';
    }
}

Promise.all([
    db.Settings.sync(),
    db.Guild.sync(),
    db.GuildConfig.sync()
]).then(async () => {
    console.log('Ready');

    console.log('Processing db.Guild');
    const guilds = await db.Guild.all();

    for (let i in guilds) {
        const guild = guilds[i];

        console.log('Updating guild', guild.id);
        console.log('Moving guild prefix');
        await db.Settings.create({
            name: `prefix:${guild.id}`,
            data: `string:${guild.prefix}`
        });
        console.log('Moving guild locale');
        await db.Settings.create({
            name: `locale:${guild.id}`,
            data: `string:${guild.locale}`
        });
    }

    console.log('Processing db.GuildConfig');
    const configs = await db.GuildConfig.all();

    for (let i in configs) {
        const config = configs[i];

        console.log('Updating', config.field, 'for guild', config.guild_id);

        if (config.field == 'notifyMaverics') continue;

        await db.Settings.create({
            name: `${config.field}:${config.guild_id}`,
            data: getFieldType(config.field) + `:${config.value}`
        });
    }
});