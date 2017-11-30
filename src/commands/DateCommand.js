const Command = require('../PlatronCommand');
const ErepublikData = require('../ErepublikData');

class DateCommand extends Command {
    constructor() {
        super('date', {
            aliases: ['date', 'convert'],
            description: () => {
                return 'Convert eRepublik day to a date';
            },
            args: [
                {
                    id: 'day',
                    type: 'integer'
                }
            ],
            usage: 'date [eDay]'
        });
    }

    async exec(message, args) {
        await message.reply(ErepublikData.dayToDate(args.day).format('ll'));
    }
}

module.exports = DateCommand;
