const PlatronClient = require('./src/PlatronClient');
const SequelizeProvider = require('./src/providers/SequelizeProvider');

const { Guild, Blacklist, Citizen } = require('./src/database');

require('dotenv').config();

const client = new PlatronClient({
    ownerID: ['98468246902038528'],
    commandDirectory: './src/commands/',
    inhibitorDirectory: './src/inhibitors/',
    listenerDirectory: './src/listeners/',
    cronDirectory: './src/cronjobs/',
    rolesDirectory: './src/roles/',
    handleEdits: false,
    defaultCooldown: 1000,
    commandUtil: true,
    prefix: message => {
        if (!message.guild) {
            return '!';
        }

        const id = message.guild.id;
        let prefix = client.databases.guilds.get(id, 'prefix');

        if (!prefix) {
            client.databases.guilds.set(id, 'prefix', '!');
            return '!';
        }

        return prefix;
    }
}, {
    disableEveryone: true
});

client.addDatabase('guilds', new SequelizeProvider(Guild));
client.addDatabase('blacklist', new SequelizeProvider(Blacklist));
client.addDatabase('citizens', new SequelizeProvider(Citizen));

const syncSettings = {
    force: client.env('DATABASE_FORCE', false),
    alter: client.env('DATABASE_ALTER', false)
};

Promise.all([
    Guild.sync(syncSettings),
    Blacklist.sync(syncSettings),
    Citizen.sync(syncSettings)
]).then(() => {
    console.log('Sync complete. Attempting to log in');
    client.login(client.env('TOKEN', ()=>{
        throw "Bot TOKEN not provided!";
    })).then(() => {
        console.log('Successfully logged in');
        client.user.setGame('eRepublik');
    }).catch(console.log);
});

process.on('unhandledRejection', err => console.error(err));
