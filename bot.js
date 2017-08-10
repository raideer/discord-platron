const PlatronClient = require('./src/PlatronClient');
const SequelizeProvider = require('./src/providers/SequelizeProvider');

const { Guild, Blacklist, Citizen } = require('./src/database');

require('dotenv').config();

const client = new PlatronClient({
    ownerID: ['98468246902038528'],
    commandDirectory: './src/commands/',
    inhibitorDirectory: './src/inhibitors/',
    listenerDirectory: './src/listeners',
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

client.env = (key, defaultValue = null) => {
    if (process.env[key]) {
        return process.env[key];
    }

    if (typeof defaultValue == 'function') {
        return defaultValue.call(client);
    }

    return defaultValue;
}

client.addDatabase('guilds', new SequelizeProvider(Guild));
client.addDatabase('blacklist', new SequelizeProvider(Blacklist));
client.addDatabase('citizens', new SequelizeProvider(Citizen));

const force = false;

Promise.all([
    Guild.sync({force: force}),
    Blacklist.sync({force: force}),
    Citizen.sync({force: force})
]).then(() => {
    client.login(client.env('TOKEN', ()=>{
        throw "Bot TOKEN not provided!";
    })).then(() => {
        console.log('Started up');
    }).catch(console.error);
});

process.on('unhandledRejection', err => console.error(err));
