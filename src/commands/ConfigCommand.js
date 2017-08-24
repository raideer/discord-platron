const Command = require('../PlatronCommand');

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
            ownerOnly: true,
            channelRestriction: 'guild'
        });
    }

    runSet(message, args) {
        switch(args.command) {
            case "prefix":
                this.client.databases.guilds.set(message.guild.id, 'prefix', args.arg1);
                return message.reply(this.client._('command.config.prefix_changed', `**${message.guild.name}**`, `\`${args.arg1}\``));
                break;
            case "locale":
                const locales = ['en', 'lv'];
                if (locales.indexOf(args.arg1) === -1) {
                    return message.reply(`Locale code \`${args.arg1}\` not recognised`);
                }

                this.client.databases.guilds.set(message.guild.id, 'locale', args.arg1);
                this.client.localize.setLocale(args.arg1);

                const reply_message = this.client._('command.config.locale_changed', `**${message.guild.name}**`);
                return message.reply(`:white_check_mark: ${reply_message}`)
                break;
            default:
                message.reply(this.client._('bot.invalid_request'));
                break;
        }
    }

    runGet(message, args) {
        switch(args.command) {
            case "link":
                return message.reply(`<https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=268435464>`)
                break;
        }
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
                message.reply(this.client._('bot.invalid_request'));
                break;
        }
    }
}

module.exports = ConfigCommand;
