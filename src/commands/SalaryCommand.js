const Command = require('../PlatronCommand');
const { getFlag, number } = require('../utils');
const request = require('request');

class SalaryCommand extends Command {
    constructor() {
        super('salary', {
            aliases: ['jobs', 'salary', 'j']
        });
    }

    exec(message) {
        const apiKey = this.client.env('EREP_API', () => {
            throw "eRepublik Deutchland API key is not set!";
        });

        request
            .get(`https://api.erepublik-deutschland.de/${apiKey}/jobmarket/bestoffers/`)
            .on('data', (buffer) => {
                let data = JSON.parse(buffer.toString());

                if (data.status != 'ok') {
                    return message.reply(this.client._('bot.invalid_request'));
                }

                let limit = (data.bestoffers.length < 10)?data.bestoffers.length:10;

                if (limit === 0) {
                    return message.reply("No offers found. Try again later");
                }

                let answer = `**Best job offers:**\n\n`;
                for (let i = 0; i < limit; i++) {
                    let offer = data.bestoffers[i];
                    answer += `**${number(offer.salary)} cc** (${number(offer.netto)} NET) @ ${getFlag(offer.country_name)} __${offer.country_name}__ (${offer.citizen_name})\n`;
                }

                message.reply(answer);
            })
            .on('error', (error) => {
                return message.reply(this.client._('bot.invalid_request'));
            })
            ;
    }
}

module.exports = SalaryCommand;
