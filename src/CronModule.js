const { AkairoModule } = require('discord-akairo');
const { CronJob } = require('cron');

module.exports = class CronModule extends AkairoModule {
    constructor(id, exec, options) {
        super(id, exec, options);

        if (!options && typeof exec === 'object') {
            options = exec;
            exec = null;
        }

        this.tab = options.tab || '* * * * *';
    }

    run() {
        const tab = typeof this.tab === 'function' ? this.tab() : this.tab;

        this.cron = new CronJob(tab, this.exec, null, true, null, this);
    }

    disable() {
        if (this.cron) {
            this.cron.stop();
        }

        super.disable();
    }
};
