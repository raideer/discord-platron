const { AkairoModule } = require('discord-akairo');
const { CronJob } = require('cron');

class CronModule extends AkairoModule {
    constructor(id, exec, options) {
        super(id, exec, options);

        if (!options && typeof exec === 'object') {
            options = exec;
            exec = null;
        }

        this.tab = options.tab || '* * * * *';
    }

    run() {
        this.cron = new CronJob(this.tab, this.exec, null, true, null, this);
    }

    disable() {
        if (this.cron) {
            this.cron.stop();
        }

        super.disable();
    }
}
module.exports = CronModule;
