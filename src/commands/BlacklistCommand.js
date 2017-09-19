const Command = require('../PlatronCommand');

class BlacklistCommand extends Command {
    constructor() {
        super('blacklist', {
            aliases: ['ban', 'unban'],
            args: [
                {
                    id: 'user',
                    type: 'user'
                },
                {
                    id: 'reason',
                    type: 'string'
                },
                {
                    id: 'verify',
                    type: 'string',
                    prompt: {
                        start: (message, args) => {
                            const user = args.user;
                            const action = message.util.alias;

                            const l_action = this.client._(`command.blacklist.${action}`);
                            const l_confirm = this.client._('bot.prompt.confirm', `__${l_action}__ **${user.username}** (yes/no)?`);
                            return l_confirm;
                        }
                    }
                }
            ],
            ownerOnly: true,
            showInHelp: false
        });
    }

    exec(message, args) {
        if (!args.verify.toLowerCase().startsWith('y')) {
            return;
        }

        let response = this.client._('bot.invalid_request');
        const Blacklist = this.client.databases.blacklist;
        const is_banned = Blacklist.get(args.user.id, 'id', false);

        switch (message.util.alias) {
        case 'ban':
            if (is_banned) {
                response = this.client._('command.blacklist.user_already_banned', `**${args.user.username}**`);
                break;
            }

            Blacklist.set(args.user.id, 'reason', args.reason);

            response = ':no_entry: ';
            response += this.client._('command.blacklist.user_banned', `**${args.user.username}**`);
            response += ` (ID ${args.user.id})`;
            break;
        case 'unban':
            if (!is_banned) {
                response = this.client._('command.blacklist.user_not_banned', `**${args.user.username}**`);
                break;
            }

            Blacklist.clear(args.user.id);
            response = ':white_check_mark: ';
            response += this.client._('command.blacklist.user_unbanned', `**${args.user.username}**`);
            break;
        }


        message.reply(response);
    }
}

module.exports = BlacklistCommand;
