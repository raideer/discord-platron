const Command = require('../PlatronCommand');

class PingCommand extends Command {
    constructor() {
        super('ping', {
            aliases: ['ping', 'hello'],
            showInHelp: false
        });
    }

    exec(message) {
        return message.reply('Pong!').then(sent => {
            const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);
            const text = `🔂\u2000**RTT**: ${timeDiff} ms\n💟\u2000**Heartbeat**: ${Math.round(this.client.ping)} ms`;
            return sent.edit(`${message.author} Pong!\n${text}`);
        });
    }
}

module.exports = PingCommand;
