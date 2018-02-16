const { AkairoHandler } = require('discord-akairo');
const CronModule = require('./CronModule');

module.exports = class CronHandler extends AkairoHandler {
    constructor(client, options) {
        super(client, options.cronDirectory, CronModule);
    }
};
