const Command = require('../PlatronCommand');
const request = require('request');
const { getFlag, number, strToColor } = require('../utils');
const { RichEmbed } = require('discord.js');

class CombatOrdersCommand extends Command {
    constructor() {
        super('co', {
            aliases: ['co'],
            args: [
                {
                    id: 'div',
                    type: ['1', '2', '3', '4', 'air'],
                    default: null
                }
            ],
            description: () => {
                return this.client._('command.combatorders.description');
            },
            usage: 'co [1|2|3|4|air]',
            usageExamples: [
                'co',
                'co air'
            ]
        });
    }

    respond(message, args, data) {
        if (data.status == 'ok') {
            let battles = {};
            let co;

            for (let i in data.active) {
                co = data.active[i];

                if (args.div == 'air') {
                    args.div = 11;
                }

                if (args.div != co.division && args.div !== null) {
                    continue;
                }

                if (!battles[co.battle_id]) {
                    battles[co.battle_id] = {
                        cos: []
                    };

                    Object.assign(battles[co.battle_id], co);
                }

                battles[co.battle_id].cos.unshift(co);
            }

            if (Object.keys(battles).length === 0) {
                let div = args.div?args.div:'any';
                return message.reply(this.client._('command.combatorders.not_found', `**${div}**`));
            }

            let embeds = [];

            for (let i in battles) {
                let battle = battles[i];
                let answer = '';

                const l_budget = this.client._('command.combatorders.budget');
                const l_vs = this.client._('command.combatorders.vs');
                const l_side = this.client._('command.combatorders.side');
                const l_fight_for = this.client._('command.combatorders.fight_for');

                for(let i in battle.cos){
                    co = battle.cos[i];

                    answer += (co.division === 11)? `AIR BATTLE: `:`DIV **${co.division}**: `;
                    answer += ` __**${number(co.reward)}cc**__/m (${number(co.budget)} cc ${l_budget}) | ${getFlag(co.country.name)} **${co.country.name}** ${l_side}\n`;
                }

                embeds.push(new RichEmbed()
                    .setTitle(`${getFlag(battle.attacker.name)} **${battle.attacker.name}** ${l_vs} ${getFlag(battle.defender.name)} **${battle.defender.name}** - ${l_fight_for} *${battle.region.name}*`)
                    .setURL(`https://www.erepublik.com/en/military/battlefield-new/${battle.battle_id}`)
                    .setDescription(answer)
                    .setColor(strToColor(battle.attacker.name))
                );
            }

            for (let i in embeds) {
                message.channel.send({
                    embed: embeds[i]
                });
            }
        }
    }

    exec(message, args) {
        const apiKey = this.client.env('EREP_API', () => {
            throw "eRepublik Deutchland API key is not set!";
        });

        request
            .get(`https://api.erepublik-deutschland.de/${apiKey}/battles/cos/active/`, (error, response, body) => {
                if (error) {
                    return message.reply(this.client._('bot.invalid_request'));
                }

                let data = JSON.parse(body);
                this.respond(message, args, data);
            });
    }
}

module.exports = CombatOrdersCommand;
