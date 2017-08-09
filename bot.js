const { AkairoClient } = require('discord-akairo');

const SequelizeProvider = require('./providers/SequelizeProvider');
const { Guild, Blacklist } = require('./database');

require('dotenv').config();

const client = new AkairoClient({
    ownerID: ['98468246902038528'],
    commandDirectory: './commands/',
    inhibitorDirectory: './inhibitors/',
    handleEdits: true,
    commandUtil: true,
    prefix: message => {
        if (!message.guild) {
            return '!';
        }

        const id = Number(message.guild.id);
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

const force = false;

Promise.all([
    Guild.sync({force: force}),
    Blacklist.sync({force: force})
]).then(() => {
    client.login(client.env('TOKEN', ()=>{
        throw "Bot TOKEN not provided!";
    })).then(() => {
        console.log('Started up');
    }).catch(console.error);
});

process.on('unhandledRejection', err => console.error(err));
