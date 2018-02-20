const winston = require('winston');
const memwatch = require('memwatch-next');
require('winston-daily-rotate-file');
const PlatronClient = require('./src/PlatronClient');
const { SequelizeProvider } = require('discord-akairo');
require('dotenv').config();
const ErepublikData = require('./src/ErepublikData');

// Configuring logger
winston.configure({
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            name: 'log-file',
            filename: './logs/log'
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

process.on('uncaughtException', error => {
    winston.error(error);
});

memwatch.on('leak', leak => {
    winston.error('Memory leak', leak);
});
// END Configuring logger

const db = require('./db/models/index');

const options = {
    ownerID: ['362625609538600971'],
    commandDirectory: './src/commands/',
    inhibitorDirectory: './src/inhibitors/',
    listenerDirectory: './src/listeners/',
    cronDirectory: './src/cronjobs/',
    handleEdits: false,
    defaultCooldown: 1000,
    commandUtil: true,
    prefix: message => {
        if (!message.guild) {
            return '!';
        }

        const id = message.guild.id;
        const prefix = client.databases.guilds.get(id, 'prefix');

        if (!prefix) {
            client.databases.guilds.set(id, 'prefix', '!');
            return '!';
        }

        return prefix;
    }
};

const clientOptions = {
    disableEveryone: true
};

const client = new PlatronClient(options, clientOptions);

client.setDatabase('guilds', new SequelizeProvider(db.Guild));
client.setDatabase('citizens', new SequelizeProvider(db.Citizen));
client.setDatabase('roles', new SequelizeProvider(db.Role));
client.setDatabase('config', new SequelizeProvider(db.GuildConfig));
client.setDatabase('push', new SequelizeProvider(db.Push));

const timer = winston.startTimer();

Promise.all([
    db.Guild.sync(),
    db.Citizen.sync(),
    db.Role.sync(),
    db.GuildConfig.sync(),
    db.Push.sync(),
    ErepublikData._initDb()
]).then(async () => {
    timer.done('Finished syncing database.');
    winston.info('Attempting to log in');

    await client.login(client.env('TOKEN', () => {
        throw 'Bot TOKEN not provided!';
    }));

    winston.info('Successfully logged in');
    client.user.setActivity('eRepublik');
});
