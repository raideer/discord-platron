const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');
const moment = require('moment-timezone');
const ErepublikData = require('../ErepublikData');

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
                    type: 'integer',
                    default: null
                }
            ]
        });
    }

    async exec(message, args) {
        if (!args.battleId) {
            return this.client.platron_utils.invalidCommand(message, this);
        }

        const data = await this.client.platron_utils.privateApi(`battle/${args.battleId}`);

        if (!data) {
            return message.reply(this.client._('bot.invalid_request'));
        }

        const l_vs = this.client._('command.combatorders.vs');
        const l_fight_for = this.client._('command.combatorders.fight_for');

        const embed = new RichEmbed();

        const attackerName = ErepublikData.countryIdToName(data.inv.id);
        const defenderName = ErepublikData.countryIdToName(data.def.id);
        moment.locale(message.locale);

        embed.setURL(`https://www.erepublik.com/en/military/battlefield/${args.battleId}`);
        embed.setTitle(`${this.client.platron_utils.getFlag(attackerName)} **${attackerName}** ${l_vs} ${this.client.platron_utils.getFlag(defenderName)} **${defenderName}** - ${l_fight_for} *${data.region.name}*`);
        // embed.addField(this.client._('command.battle.status'), !battle.general.finished_at ? `:red_circle: ${this.client._('command.battle.active')}` : `:white_circle: ${this.client._('command.battle.finished')}`, true);
        // embed.addField(this.client._('command.battle.started'), moment.tz(data.start * 1000, 'America/Los_Angeles').fromNow(), true);
        embed.addField(this.client._('command.battle.round'), data.zone_id, true);
        embed.addField(this.client._('command.battle.last_round_started'), moment.tz(data.start * 1000, 'America/Los_Angeles').fromNow(), true);

        message.channel.send({
            embed
        });
    }
}

module.exports = BattleDetailsCommand;
