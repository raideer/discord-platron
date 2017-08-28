const { Listener } = require('discord-akairo');

function exec() {
    if (this.client.cronHandler) {
        this.client.cronHandler.modules.forEach((module) => {
            console.log('Running cron module', module.id);
            module.run();
        });
    }
}

module.exports = new Listener('ready', exec, {
    emitter: 'client',
    eventName: 'ready',
    type: 'once'
});
