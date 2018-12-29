const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');
const moment = require('moment-timezone');
const ErepublikData = require('../ErepublikData');
const request = require('request-promise');
const FuzzySearch = require('../FuzzySearch');

class BattleDetailsCommand extends Command {
    constructor() {
        super('battle', {
            aliases: ['battle', 'b'],
            description: () => {
                return 'Returns details about a specific battle';
            },
            usage: 'battle <battle_id>',
            args: [
                {
                    id: 'battleId',
                    match: 'rest'
                }
            ]
        });
    }

    async exec(message, args) {
        if (!args.battleId) {
            return this.client.platron_utils.invalidCommand(message, this);
        }

        const battleData = await request('https://www.erepublik.com/en/military/campaigns-new', {
            json: true,
            timeout: 3000
        });

        let battle = null;

        if (!isNaN(args.battleId)) {
            battle = battleData.battles[args.battleId];
        } else {
            const battles = Object.keys(battleData.battles).map(id => battleData.battles[id]);
            const searcher = new FuzzySearch(battles, ['region.name', 'city.name']);
            const result = searcher.search(args.battleId);

            if (result.length > 0) {
                battle = result[0];
            }
        }

        if (!battle) {
            return message.reply(`Could not find battle \`${args.battleId}\``);
        }

        const l_vs = this.client._('command.combatorders.vs');
        const l_fight_for = this.client._('command.combatorders.fight_for');

        const embed = new RichEmbed();

        const attackerName = ErepublikData.countryIdToName(battle.inv.id);
        const defenderName = ErepublikData.countryIdToName(battle.def.id);
        moment.locale(message.locale);

        embed.setURL(`https://www.erepublik.com/en/military/battlefield/${battle.id}`);
        embed.setTitle(`${this.client.platron_utils.getFlag(attackerName)} **${attackerName}** ${l_vs} ${this.client.platron_utils.getFlag(defenderName)} **${defenderName}** - ${l_fight_for} *${battle.region.name}*`);
        // embed.addField(this.client._('command.battle.status'), !battle.general.finished_at ? `:red_circle: ${this.client._('command.battle.active')}` : `:white_circle: ${this.client._('command.battle.finished')}`, true);
        // embed.addField(this.client._('command.battle.started'), moment.tz(battle.start * 1000, 'America/Los_Angeles').fromNow(), true);
        embed.addField(this.client._('command.battle.round'), battle.zone_id, true);
        embed.addField(this.client._('command.battle.last_round_started'), moment.tz(battle.start * 1000, 'America/Los_Angeles').fromNow(), true);

        message.channel.send({
            embed
        });
    }
}

module.exports = BattleDetailsCommand;
