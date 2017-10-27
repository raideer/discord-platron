const Command = require('../PlatronCommand');
const request = require('request-promise');

class SalaryCommand extends Command {
    constructor() {
        super('salary', {
            aliases: ['jobs', 'salary', 'j'],
            usage: 'salary'
        });
    }

    async exec(message) {
        const apiKey = this.client.env('EREP_API', () => {
            throw 'eRepublik Deutchland API key is not set!';
        });

        const data = await request.get({
            method: 'GET',
            json: true,
            uri: `https://api.erepublik-deutschland.de/${apiKey}/jobmarket/bestoffers/`
        });

        if (data.status != 'ok') {
            return message.reply(this.client._('bot.invalid_request'));
        }

        const limit = data.bestoffers.length < 10 ? data.bestoffers.length : 10;

        if (limit === 0) {
            await message.reply('No offers found. Try again later');
            return;
        }

        let answer = '**Best job offers:**\n\n';
        for (let i = 0; i < limit; i++) {
            const offer = data.bestoffers[i];
            answer += `**${this.client.platron_utils.number(offer.salary)} cc** (${this.client.platron_utils.number(offer.netto)} NET) @ ${this.client.platron_utils.getFlag(offer.country_name)} __${offer.country_name}__ (${offer.citizen_name})\n`;
        }

        message.reply(answer);
    }
}

module.exports = SalaryCommand;
