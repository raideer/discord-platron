const Command = require('../PlatronCommand');

class PingCommand extends Command {
    constructor() {
        super('8ball', {
            aliases: ['8ball']
        });
    }

    exec(message) {
        const options = [
            this.client._('command.8ball.affirmative1'),
            this.client._('command.8ball.affirmative2'),
            this.client._('command.8ball.affirmative3'),
            this.client._('command.8ball.affirmative4'),
            this.client._('command.8ball.affirmative5'),
            this.client._('command.8ball.affirmative6'),
            this.client._('command.8ball.affirmative7'),
            this.client._('command.8ball.affirmative8'),

            this.client._('command.8ball.neutral1'),
            // this.client._('command.8ball.neutral2'),
            // this.client._('command.8ball.neutral3'),
            this.client._('command.8ball.neutral4'),
            this.client._('command.8ball.neutral5'),
            // this.client._('command.8ball.neutral6'),

            this.client._('command.8ball.negative1'),
            this.client._('command.8ball.negative2'),
            this.client._('command.8ball.negative3'),
            this.client._('command.8ball.negative4'),
            this.client._('command.8ball.negative5')
        ];

        const n = Math.floor(Math.random() * options.length);
        message.channel.send(`**${options[n]}**`);
    }
}

module.exports = PingCommand;
