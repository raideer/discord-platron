const Command = require('../PlatronCommand');
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
            usage: 'co [1|2|3|4|air]'
        });
    }

    respond(message, args, data) {
        if (data.status == 'ok') {
            const battles = {};
            let co;

            for (const i in data.active) {
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
                const div = args.div ? args.div : 'any';
                return message.reply(this.client._('command.combatorders.not_found', `**${div}**`));
            }

            const embeds = [];

            for (const i in battles) {
                const battle = battles[i];
                let answer = '';

                const l_budget = this.client._('command.combatorders.budget');
                const l_vs = this.client._('command.combatorders.vs');
                const l_side = this.client._('command.combatorders.side');
                const l_fight_for = this.client._('command.combatorders.fight_for');

                for (const j in battle.cos) {
                    co = battle.cos[j];

                    answer += co.division === 11 ? 'AIR BATTLE: ' : `DIV **${co.division}**: `;
                    answer += ` __**${this.client.platron_utils.number(co.reward)}cc**__/m (${this.client.platron_utils.number(co.budget)} cc ${l_budget}) | ${this.client.platron_utils.getFlag(co.country.name)} **${co.country.name}** ${l_side}\n`;
                }

                embeds.push(
                    new RichEmbed()
                    .setTitle(`${this.client.platron_utils.getFlag(battle.attacker.name)} **${battle.attacker.name}** ${l_vs} ${this.client.platron_utils.getFlag(battle.defender.name)} **${battle.defender.name}** - ${l_fight_for} *${battle.region.name}*`)
                    .setURL(`https://www.erepublik.com/en/military/battlefield-new/${battle.battle_id}`)
                    .setDescription(answer)
                    .setColor(this.client.platron_utils.strToColor(battle.attacker.name))
                );
            }

            for (const i in embeds) {
                message.channel.send({
                    embed: embeds[i]
                });
            }
        }
    }

    async exec(message, args) {
        const data = await this.client.platron_utils.deutchlandApi('battles/cos/active');
        this.respond(message, args, data);
    }
}

// module.exports = CombatOrdersCommand;
