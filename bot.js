const { SequelizeProvider } = require('discord-akairo');
const PlatronClient = require('./src/PlatronClient');
const ErepublikData = require('./src/ErepublikData');
const spawn = require('child_process').spawn;
require('winston-daily-rotate-file');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

winston.configure({
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            name: 'log-file',
            filename: './logs/log',
            maxFiles: 4
        })
    ]
});

winston.exitOnError = false;
winston.cli();

process.on('uncaughtException', error => {
    winston.error(error);
});

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
client.setDatabase('bestoffers', new SequelizeProvider(db.BestOffer));

const timer = winston.startTimer();

Promise.all([
    db.Guild.sync(),
    db.Citizen.sync(),
    db.Role.sync(),
    db.GuildConfig.sync(),
    db.Push.sync(),
    db.BestOffer.sync(),
    ErepublikData._initDb()
]).then(async () => {
    timer.done('Finished syncing database.');
    winston.info('Attempting to log in');

    await client.login(client.env('TOKEN', () => {
        throw 'Bot TOKEN not provided!';
    }));

    winston.info('Successfully logged in');
    client.user.setActivity('eRepublik');

    winston.info('Spawning `notifyEpics` childprocess');
    const epicNotifier = spawn('node', [path.resolve('./src/subprocess/notifyEpics.js')], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    epicNotifier.on('message', payload => {
        client.notifyEpic(payload);
    });

    epicNotifier.on('exit', () => winston.error('Epic notifier exited'));

    winston.info('Spawning `updateBestOffers` childprocess');
    const boUpdater = spawn('node', [path.resolve('./src/subprocess/updateBestOffers.js')], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    boUpdater.on('message', payload => {
        winston.info('BO:', payload);
    });

    boUpdater.on('exit', () => winston.error('BO updater exited'));
});
