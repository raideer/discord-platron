const { Command } = require('discord-akairo');
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
                return message.reply(`No CO's found for division \`${div}\``);
            }

            let embeds = [];
            // let answers = [];

            for (let i in battles) {
                let battle = battles[i];
                // let answer = `\n${getFlag(battle.attacker.name)} **${battle.attacker.name}** vs ${getFlag(battle.defender.name)} **${battle.defender.name}** - Fight for *${battle.region.name}*\n`;
                //     answer += `<https://www.erepublik.com/en/military/battlefield-new/${battle.battle_id}>\n`;
                let answer = '';
                for(let i in battle.cos){
                    co = battle.cos[i];
                    answer += (co.division === 11)? `  AIR BATTLE: `:`  DIV **${co.division}**: `;
                    answer += ` __**${number(co.reward)}cc**__/m (${number(co.budget)} cc budget) | ${getFlag(co.country.name)} **${co.country.name}** side\n`;
                }

                embeds.push(new RichEmbed()
                    .setTitle(`${getFlag(battle.attacker.name)} **${battle.attacker.name}** vs ${getFlag(battle.defender.name)} **${battle.defender.name}** - Fight for *${battle.region.name}*`)
                    .setURL(`https://www.erepublik.com/en/military/battlefield-new/${battle.battle_id}`)
                    .setDescription(answer)
                    .setColor(strToColor(battle.attacker.name))
                );

                // answers.push(answer);
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
                    return message.reply('There was a problem while processing this request');
                }

                let data = JSON.parse(body);
                this.respond(message, args, data);
            });
    }
}

module.exports = CombatOrdersCommand;
