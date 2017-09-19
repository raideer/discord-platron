const { Listener } = require('discord-akairo');
const winston = require('winston');

const exec = async (message, command) => {
    if (this.client.commandHandler.modules.has('help')) {
        winston.verbose('Displaying help command for', command.id);
        const help = this.client.commandHandler.modules.get('help');
        const response = help.getHelp(message, command);
        await message.reply(response);
    }
};

module.exports = new Listener('invalidCommand', exec, {
    emitter: 'client',
    eventName: 'invalidUsage'
});
