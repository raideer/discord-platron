const { Command } = require('discord-akairo');

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
                            let action = message.util.alias;
                            return `Are you sure you want to ${action} **${user.username}** (yes/no)?`;
                        }
                    }
                }
            ]
        });
    }

    exec(message, args) {
        if (!args.verify.toLowerCase().startsWith('y')) {
            return;
        }

        let response = "Invalid request";

        switch(message.util.alias) {
            case "ban":
                this.client.databases.blacklist.set(args.user.id, 'reason', args.reason);
                response = `Blacklisted user **${args.user.username}** (${args.user.id}) `;
                if (args.reason.length > 0) {
                    response += `for \`${args.reason}\``;
                }
                break;
            case "unban":
                this.client.databases.blacklist.clear(args.user.id);
                response = `Removed user **${args.user.username}** from the blacklist`;
                break;
        }


        message.channel.send(response);
    }
}

module.exports = BlacklistCommand;
