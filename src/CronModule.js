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
        let tab = (typeof this.tab === 'function')?this.tab.call(this):this.tab;

        this.cron = new CronJob(tab, this.exec, null, true, null, this);
    }

    disable() {
        if (this.cron) {
            this.cron.stop();
        }

        super.disable();
    }
}
module.exports = CronModule;
