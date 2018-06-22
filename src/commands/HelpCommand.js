// const Command = require('../PlatronCommand');
// const _ = require('lodash');

// class HelpCommand extends Command {
//     constructor() {
//         super('help', {
//             aliases: ['help'],
//             usage: () => {
//                 return `help ${this.client._('bot.command.command')}`;
//             },
//             args: [
//                 {
//                     id: 'command',
//                     type: 'commandAlias',
//                     default: false
//                 }
//             ]
//         });
//     }

//     getHelp(message, command) {
//         const a = [];
//         const prefix = message.util.prefix;
//         const aliases = _.drop(command.aliases).length > 0 ? `(${_.drop(command.aliases).join(' | ')})` : '';
//         let description = typeof command.description === 'function' ? command.description.call(this) : command.description;
//         if (description) {
//             description = `- ${description}`;
//         }

//         a.push(`:black_small_square: **${_.first(command.aliases)}** ${aliases} ${description}`);

//         if (command.usage) {
//             if (typeof command.usage === 'function') {
//                 a.push(`${this.client._('bot.command.usage')}: \`${prefix}${command.usage.call(this)}\``);
//             } else {
//                 a.push(`${this.client._('bot.command.usage')}: \`${prefix}${command.usage}\``);
//             }
//         }

//         if (command.usageExamples.length > 0) {
//             a.push(`${this.client._('bot.command.examples')}:`);

//             for (const i in command.usageExamples) {
//                 a.push(`:white_small_square: \`${prefix}${command.usageExamples[i]}\``);
//             }

//             a.push('');
//         }

//         if (command.usageNote) {
//             const note = typeof command.usageNote === 'function' ? command.usageNote.call(this) : command.usageNote;
//             a.push(note);
//         }

//         return a.join('\n');
//     }

//     exec(message, args) {
//         const answers = [];

//         if (args.command) {
//             answers.push(this.getHelp(message, args.command));
//         } else {
//             const command_list = this.client.commandHandler.modules.array().filter(command => command.showInHelp && !command.ownerOnly).map(command => {
//                 return `\`${_.first(command.aliases)}\``;
//             });

//             answers.push('```Append `-en` or `-lv` for bot to respond in a specific language');
//             answers.push('For example: `!help -en` ```');
//             answers.push(this.getHelp(message, this));
//             answers.push(`${this.client._('bot.command.list_of_commands')}: ${command_list.join(', ')}`);
//         }

//         if (answers.length <= 1) {
//             return message.channel.send('Didn\'t find anything with that criteria');
//         }

//         message.channel.send(answers.join('\n'));
//     }
// }

// module.exports = HelpCommand;

const Command = require('../PlatronCommand');
const { first } = require('lodash');

module.exports = class HelpCommand extends Command {
    constructor() {
        super('help', {
            aliases: ['help'],
            description: 'Helps you with commands',
            usage: 'help <command name>',
            args: [
                {
                    id: 'command',
                    type: 'commandAlias',
                    default: null
                }
            ]
        });
    }

    async exec(message, args) {
        const command = args.command || this;
        const usage = await command.getUsage(message.util.prefix);

        if (args.command) {
            return message.util.sendEmbed(usage);
        } else {
            const command_list = this.client.commandHandler.modules.array().filter(command => command.showInHelp && !command.ownerOnly).map(command => {
                return `\`${first(command.aliases)}\``;
            });

            return message.util.sendEmbed(usage, `List of commands: ${command_list.join(', ')}`);
        }
    }
};