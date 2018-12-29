const { Listener } = require('discord-akairo');
const winston = require('winston');

module.exports = class CommandListener extends Listener {
    constructor() {
        super('invalidCommand', {
            emitter: 'client',
            eventName: 'invalidUsage'
        });
    }

    async exec(message, command) {
        if (this.client.commandHandler.modules.has('help')) {
            winston.verbose('Displaying help command for', command.id);
            const usage = await command.getUsage();
            return message.util.sendEmbed(usage);
        }
    }
};
