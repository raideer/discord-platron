const Command = require('../PlatronCommand');
const { getFlag } = require('../utils');
const request = require('request-promise');
const { RichEmbed } = require('discord.js');

class HistoryCommand extends Command {
    constructor() {
        super('history', {
            aliases: ['history', 'h'],
            description: () => {
                // return this.client._('command.market.description');
                return 'Get player history';
            },
            usage: 'history (name|mu|party|cs) (PLAYER_NAME|PLAYER_ID)',
            usageExamples: [
                'history party Industrials',
                'history party 8075739'
            ],
            args: [
                {
                    id: 'type',
                    type: ['name', 'mu', 'party', 'cs'],
                    default: null
                },
                {
                    id: 'citizenId',
                    type: 'citizenId',
                    match: 'rest'
                }
            ]
        });
    }

    async exec(message, args) {
        const apiKey = this.client.env('EREP_API', () => {
            throw 'eRepublik Deutchland API key is not set!';
        });

        const data = await request({
            method: 'GET',
            json: true,
            uri: `https://api.erepublik-deutschland.de/${apiKey}/players/history/${args.type}/${args.citizenId}`
        });

        if (data.status != 'ok') {
            return message.reply(this.client._('bot.invalid_request'));
        }

        const playerData = data.history[args.citizenId];

        if (!playerData) {
            return message.reply('Something went wrong. Try again later');
        }

        if (!playerData[args.type]) {
            return message.reply('Something went wrong. Try again later');
        }

        const embed = new RichEmbed();

        switch (args.type) {
        case 'party': {
            embed.setTitle(`Party history for ${args.citizenId}`);
            const text = [];
            for (const i in playerData.party) {
                const historyData = playerData.party[i];
                text.push(`From [${historyData.party_name_from}](https://www.erepublik.com/en/party/${historyData.party_id_from})`);
                text.push(`To [${historyData.party_name_to}](https://www.erepublik.com/en/party/${historyData.party_id_to}) (${historyData.added})`);
                text.push('');
            }

            embed.setDescription(text.join('\n'));
            break;
        }
        case 'name': {
            embed.setTitle(`Name history for ${args.citizenId}`);
            const text = [];
            for (const i in playerData.name) {
                const historyData = playerData.name[i];
                text.push(`From **${historyData.name_from}**`);
                text.push(`To **${historyData.name_to}** (${historyData.added})`);
                text.push('');
            }

            embed.setDescription(text.join('\n'));
            break;
        }
        case 'mu': {
            embed.setTitle(`Military Unit history for ${args.citizenId}`);
            const text = [];
            for (const i in playerData.mu) {
                const historyData = playerData.mu[i];
                text.push(`From [${historyData.mu_name_from}](https://www.erepublik.com/en/military/military-unit/${historyData.mu_id_from})`);
                text.push(`To [${historyData.mu_name_to}](https://www.erepublik.com/en/military/military-unit/${historyData.mu_id_to}) (${historyData.added})`);
                text.push('');
            }

            embed.setDescription(text.join('\n'));
            break;
        }
        case 'cs': {
            embed.setTitle(`Citizenship history for ${args.citizenId}`);
            const text = [];
            for (const i in playerData.cs) {
                const historyData = playerData.cs[i];
                text.push(`From ${getFlag(historyData.country_name_from)} **${historyData.country_name_from}**`);
                text.push(`To ${getFlag(historyData.country_name_to)} **${historyData.country_name_to}** (${historyData.added})`);
                text.push('');
            }

            embed.setDescription(text.join('\n'));
            break;
        }
        default: {
            return message.reply(this.client._('bot.invalid_request'));
        }
        }

        embed.setColor('#3b9de4');

        message.channel.send({ embed });
    }
}

module.exports = HistoryCommand;
