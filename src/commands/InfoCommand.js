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
                    id: 'citizenId',
                    type: 'citizenId',
                    match: 'rest'
                }
            ]
        });
    }

    exec(message, args) {
        if (!args.citizenId) {
            return message.reply('Sorry, didn\'t find anything');
        }

        return message.reply(`https://www.erepublik.com/en/citizen/profile/${args.citizenId}`);
    }
}

module.exports = InfoCommand;
