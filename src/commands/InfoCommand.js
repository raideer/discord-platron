const Command = require('../PlatronCommand');

class InfoCommand extends Command {
    constructor() {
        super('citizenLink', {
            aliases: ['link', 'l', 'profile'],
            description: () => {
                return '';
            },
            usage: 'link (user)',
            args: [
                {
                    id: 'user',
                    type: 'user'
                }
            ]
        });
    }

    async exec(message, args) {
        const Citizen = this.client.databases.citizens.table;
        const citizen = await Citizen.findOne({
            where: {
                discord_id: args.user.id
            }
        });

        if (!citizen) {
            return message.reply(`**${args.user.username}** is not registered!`);
        }

        return message.reply(`https://www.erepublik.com/en/citizen/profile/${citizen.id}`);
    }
}

module.exports = InfoCommand;
