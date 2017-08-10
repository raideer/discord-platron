const { Command } = require('discord-akairo');

class ConfigCommand extends Command {
    constructor() {
        super('config', {
            aliases: ['set', 'get'],
            args: [
                {
                    id: 'command',
                    type: 'string'
                },
                {
                    id: 'arg1',
                    type: 'string'
                },
                {
                    id: 'arg2',
                    type: 'string'
                }
            ],
            channelRestriction: 'guild'
        });
    }

    runSet(message, args) {
        switch(args.command) {
            case "prefix":
                this.client.databases.guilds.set(message.guild.id, 'prefix', args.arg1);
                return message.reply(`Command prefix for guild **${message.guild.name}** set to \`${args.arg1}\``)
                break;
            default:
                message.reply(`Invalid set request`);
                break;
        }
    }

    runGet(message, args) {
    }

    exec(message, args) {
        switch(message.util.alias) {
            case "set":
                this.runSet(message, args);
                break;
            case "get":
                this.runGet(message, args);
                break;
            default:
                message.reply(`Invalid request`);
                break;
        }
    }
}

module.exports = ConfigCommand;
