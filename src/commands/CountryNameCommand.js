const Command = require('../PlatronCommand');
const ErepublikData = require('../ErepublikData');

class CountryNameCommand extends Command {
    constructor() {
        super('countryName', {
            aliases: ['countryIdToName', 'countryName'],
            description: () => {
                return 'Convert country id to a name';
            },
            args: [
                {
                    id: 'id',
                    type: 'integer'
                }
            ],
            usage: 'countryName [id]'
        });
    }

    async exec(message, args) {
        await message.reply(ErepublikData.countryIdToName(args.id));
    }
}

module.exports = CountryNameCommand;
