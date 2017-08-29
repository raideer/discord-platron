const winston = require('winston');
require('winston-daily-rotate-file');

winston.configure({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.DailyRotateFile)({
            name: 'log-file',
            filename: './logs/log'
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'error-file',
            filename: './logs/error',
            level: 'error'
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'verbose-file',
            filename: './logs/verbose',
            level: 'verbose'
        })
    ]
});

winston.level = 'verbose';
winston.exitOnError = false;
winston.cli();

winston.handleExceptions(new winston.transports.DailyRotateFile({
    name: 'error-file',
    filename: './logs/error',
    level: 'error'
}));

const PlatronClient = require('./src/PlatronClient');
const SequelizeProvider = require('./src/providers/SequelizeProvider');

const { Guild, Blacklist, Citizen, Role } = require('./src/database');

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
client.addDatabase('roles', new SequelizeProvider(Role));

const syncSettings = {
    force: client.env('DATABASE_FORCE', false),
    alter: client.env('DATABASE_ALTER', false)
};

const timer = winston.startTimer();

Promise.all([
    Guild.sync(syncSettings),
    Blacklist.sync(syncSettings),
    Citizen.sync(syncSettings),
    Role.sync(syncSettings)
]).then(() => {
    timer.done('Finished syncing database.');
    winston.info('Attempting to log in');

    client.login(client.env('TOKEN', ()=>{
        throw "Bot TOKEN not provided!";
    })).then(() => {
        winston.info('Successfully logged in');
        client.user.setGame('eRepublik');
    }).catch(winston.error);
});
