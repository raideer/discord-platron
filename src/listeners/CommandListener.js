const { Listener } = require('discord-akairo');
const winston = require('winston');

function exec(message, command) {
    if (this.client.commandHandler.modules.has('help')) {
        const help = this.client.commandHandler.modules.get('help');
        const response = help.getHelp(message, command);
        message.reply(response);
    }
}

module.exports = new Listener('invalidCommand', exec, {
    emitter: 'client',
    eventName: 'invalidUsage'
});
