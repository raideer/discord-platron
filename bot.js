const winston = require('winston');
const memwatch = require('memwatch-next');
require('winston-daily-rotate-file');

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

memwatch.on('stats', stats => {
    winston.info('Memory stats', stats);
});

const PlatronClient = require('./src/PlatronClient');
const EpicNotificator = require('./src/EpicNotificator');
const { SequelizeProvider } = require('discord-akairo');

const db = require('./db/models/index');
const _ = require('lodash');

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
        const prefix = client.databases.guilds.get(id, 'prefix');

        if (!prefix) {
            client.databases.guilds.set(id, 'prefix', '!');
            return '!';
        }

        return prefix;
    }
}, {
    disableEveryone: true
});

client.addDatabase('guilds', new SequelizeProvider(db.Guild));
client.addDatabase('blacklist', new SequelizeProvider(db.Blacklist));
client.addDatabase('citizens', new SequelizeProvider(db.Citizen));
client.addDatabase('roles', new SequelizeProvider(db.Role));
client.addDatabase('config', new SequelizeProvider(db.GuildConfig));

client.guildConfig = async (guild, key, defaultValue = null) => {
    const Config = client.databases.config.table;
    const val = await Config.findOrCreate({
        where: {
            field: key,
            guild_id: guild.id
        },
        defaults: {
            value: defaultValue
        }
    });

    return _.first(val).value;
};

const timer = winston.startTimer();

Promise.all([
    db.Guild.sync(),
    db.Blacklist.sync(),
    db.Citizen.sync(),
    db.Role.sync(),
    db.GuildConfig.sync()
]).then(async () => {
    timer.done('Finished syncing database.');
    winston.info('Attempting to log in');

    await client.login(client.env('TOKEN', () => {
        throw 'Bot TOKEN not provided!';
    }));

    client.epicNotificator = new EpicNotificator(client);

    if (client.env('EPIC_NOTIFICATOR_ENABLED', true)) {
        client.epicNotificator.run();
    }

    winston.info('Successfully logged in');
    client.user.setGame('eRepublik');
});
