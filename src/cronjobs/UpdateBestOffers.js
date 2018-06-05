const CronModule = require('../CronModule');
const spawn = require('child_process').spawn;
const winston = require('winston');
const path = require('path');

let child;

module.exports = class UpdateBestOffers extends CronModule {
    constructor() {
        super('boUpdater', {
            tab: () => {
                return '* * * * *'
            }
        });
    }

    async exec() {
        winston.info('Spawning `boUpdater` childprocess');

        if (child) {
            child.kill('SIGINT');
            child = null;
        }

        child = spawn('node', [path.resolve(__dirname, '../subprocess/updateBestOffers.js')], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });

        child.on('message', data => {
            if (data.done) {
                winston.info('Updated BO');
            } else {
                winston.info(data.msg);
            }
        });

        child.on('exit', () => {
            winston.info('BO child exited');
            child = null;
        });
    }
};
