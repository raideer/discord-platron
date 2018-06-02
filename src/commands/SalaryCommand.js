const Command = require('../PlatronCommand');
const request = require('request-promise');
const ErepublikData = require('../ErepublikData');

class SalaryCommand extends Command {
    constructor() {
        super('salary', {
            aliases: ['jobs', 'salary', 'j'],
            usage: 'salary'
        });
    }

    async exec(message) {
        const data = await this.client.platron_utils.privateApi('jobmarket/bestoffers');

        if (!data) {
            return message.reply(this.client._('bot.invalid_request'));
        }

        if (data.length === 0) {
            await message.reply('No offers found. Try again later');
            return;
        }

        let answer = '**Best job offers:**\n\n';

        data.forEach(offer => {
            answer += `**${this.client.platron_utils.number(offer.salary)} cc** (${offer.salaryLimit == 0 ? 'No' : offer.salaryLimit} limit) - ${this.client.platron_utils.getFlag(offer.countryName)} **${offer.countryName}** (${offer.citizen.name})\n`;
        });

        message.util.send(answer);
    }
}

module.exports = SalaryCommand;
