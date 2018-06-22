const { SequelizeProvider } = require('discord-akairo');

const PlatronClient = require('./src/PlatronClient');
const ErepublikData = require('./src/ErepublikData');
const spawn = require('child_process').spawn;
require('winston-daily-rotate-file');
const winston = require('winston');
const path = require('path');
require('dotenv').config();
require('colors');

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

const client = new PlatronClient();

client.setDatabase('citizens', new SequelizeProvider(db.Citizen));
client.setDatabase('bestoffers', new SequelizeProvider(db.BestOffer));

const timer = winston.startTimer();

Promise.all([
    client.settings.init(),
    client.roles.init(),
    client.databases.bestoffers.init(),
    client.databases.citizens.init(),
    ErepublikData.init()
]).then(async () => {
    timer.done('Finished syncing database.');
    winston.info('Attempting to log in');

    await client.login(client.env('TOKEN', () => {
        throw 'Bot TOKEN not provided!';
    }));

    winston.info('Successfully logged in');
    client.user.setActivity('eRepublik');

    const subs = {
        'epicNotifier': path.resolve('./src/subprocess/notifyEpics.js'),
        'boUpdater': path.resolve('./src/subprocess/updateBestOffers.js')
    };

    const processes = {};

    for (let subName in subs) {
        processes[subName] = spawn('node', [subs[subName]], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
        
        processes[subName].on('message', payload => {
            if (subName == 'epicNotifier') {
                winston.info('Received payload from epicNotifier')
                return client.notifyEpic(payload);
            }

            winston.info(`[${String(subName).yellow}] ${payload}`);
        });

        processes[subName].on('exit', code => {
            winston.error(`[${String(subName).yellow}] Process exited with code ${code}`);
        });

        processes[subName].stdout.on('data', function(data) {
            winston.info(`[${String(subName).yellow}] ${data.toString().trim()}`);
        });

        processes[subName].stderr.on('data', function(data) {
            winston.error(`[${String(subName).yellow}] ${data.toString().trim()}`);
        });
    }
});
