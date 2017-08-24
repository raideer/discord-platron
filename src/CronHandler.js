const { AkairoHandler } = require('discord-akairo');
const CronModule = require('./CronModule');

class CronHandler extends AkairoHandler {
    constructor(client, options) {
        super(client, options.cronDirectory, CronModule);
    }
}

module.exports = CronHandler;
