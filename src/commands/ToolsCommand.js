const Command = require('../PlatronCommand');
const ErepublikData = require('../ErepublikData');

class ToolsCommand extends Command {
    constructor() {
        super('tools', {
            aliases: ['tools'],
            description: 'Various helpful eRepublik tools',
            args: [
                {
                    id: 'tool',
                    type: 'string'
                },
                {
                    id: 'value',
                    type: 'rest'
                }
            ],
            usage: [
                'tools convertDate <eRepublik_date>',
                'tools countryIdToName <country_id>',
            ]
        });
    }

    async exec(message, args) {
        switch(args.tool) {
            case 'convertDate': {
                return message.util.reply(ErepublikData.dayToDate(args.value).format('ll'));
            }
            case 'countryIdToName': {
                return message.util.reply(ErepublikData.countryIdToName(args.value));
            }
            default: {
                return message.util.reply(`:no_entry: Tool \`${args.tool}\` was not found`);
            }
        }
    }
}

module.exports = ToolsCommand;
