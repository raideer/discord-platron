const { Command } = require('discord-akairo');

class ConfigCommand extends Command {
    constructor() {
        super('config', {
            aliases: ['set', 'add'],
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

    // runAdd(message, args) {
    //     switch(args.command) {
    //         case "blacklist":
    //             const user = this.client.util.resolveUser(args.arg2, this.client.users);
    //             if (user) {
    //
    //             }
    //             console.log(user);
    //             // this.client.databases.blacklist.set(args.arg1, 'reason', args.arg2);
    //             break;
    //         default:
    //             message.reply(`Invalid add request`);
    //             break;
    //     }
    // }

    exec(message, args) {
        switch(message.util.alias) {
            case "set":
                this.runSet(message, args);
                break;
            case "add":
                this.runAdd(message, args);
                break;
            default:
                message.reply(`Invalid set request`);
                break;
        }
    }
}

module.exports = ConfigCommand;
