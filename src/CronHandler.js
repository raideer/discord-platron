const { AkairoHandler } = require('discord-akairo');

class CronHandler extends AkairoHandler {
    constructor(client, options) {
        super(client, options.cronDirectory);
    }
}

module.exports = CronHandler;
