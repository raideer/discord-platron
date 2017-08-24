const Command = require('../PlatronCommand');
const _ = require('underscore');

class HelpCommand extends Command {
    constructor() {
        super('help', {
            aliases: ['help'],
            showInHelp: false
        });
    }

    exec(message, args) {
        let answers = [`__${this.client._('bot.command.list_of_commands')}__`];

        this.client.commandHandler.modules.forEach((command) => {
            let a = [];

            let aliases = (_.rest(command.aliases).length > 0)? `(${_.rest(command.aliases).join(' | ')})` : '';
            let description = (typeof command.description === 'function')?command.description.call(this):command.description;
            if (description) {
                description = '- ' + description;
            }

            a.push(`:black_small_square: **${_.first(command.aliases)}** ${aliases} ${description}`);

            if (command.usage) {
                a.push(`${this.client._('bot.command.usage')}: \`${command.usage}\``);
            }

            if (command.usageExamples.length > 0) {
                a.push(`${this.client._('bot.command.examples')}:`);

                for (let i in command.usageExamples) {
                    a.push(`:white_small_square: \`${command.usageExamples[i]}\``);
                }

                a.push('');
            }

            if (command.usageNote) {
                let note = (typeof command.usageNote === 'function')?command.usageNote.call(this):command.usageNote;
                a.push(note);
            }

            answers.push(a.join('\n'));
        });

        message.channel.send(answers.join('\n'));
    }
}

module.exports = HelpCommand;