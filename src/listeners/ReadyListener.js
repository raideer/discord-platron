const { Listener } = require('discord-akairo');
const winston = require('winston');

module.exprts = class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            eventName: 'ready',
            type: 'once'
        });
    }

    exec() {
        if (this.client.cronHandler) {
            if (this.client.env('CRON_ENABLED', true)) {
                this.client.cronHandler.modules.forEach(module => {
                    winston.info('Running cron module', module.id);
                    module.run();
                });
            } else {
                winston.warn('Cron module is disabled');
            }
        }
    }
};
