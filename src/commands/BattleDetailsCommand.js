const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');
const moment = require('moment-timezone');

class BattleDetailsCommand extends Command {
    constructor() {
        super('battle', {
            aliases: ['battle', 'b'],
            description: () => {
                return 'Returns details about a specific battle';
            },
            usage: 'battle [battleID]',
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

        const data = await this.client.platron_utils.deutchlandApi(`battles/details/${args.battleId}`);

        if (data.status !== 'ok') {
            return message.reply(this.client._('bot.invalid_request'));
        }

        const l_vs = this.client._('command.combatorders.vs');
        const l_fight_for = this.client._('command.combatorders.fight_for');

        const embed = new RichEmbed();
        const battle = data.details[Object.keys(data.details)[0]];

        embed.setTitle(`${this.client.platron_utils.getFlag(battle.attacker.name)} **${battle.attacker.name}** ${l_vs} ${this.client.platron_utils.getFlag(battle.defender.name)} **${battle.defender.name}** - ${l_fight_for} *${battle.region.name}*`);
        embed.addField(this.client._('command.battle.status'), !battle.general.finished_at ? `:red_circle: ${this.client._('command.battle.active')}` : `:white_circle: ${this.client._('command.battle.finished')}`, true);
        embed.addField(this.client._('command.battle.started'), moment.tz(battle.general.started_at, 'America/Los_Angeles').fromNow(), true);
        embed.addField(this.client._('command.battle.round'), battle.general.round, true);
        moment.locale(message.locale);
        embed.addField(this.client._('command.battle.last_round_started'), moment.tz(battle.general.round_started_at, 'America/Los_Angeles').fromNow(), true);

        message.channel.send({
            embed
        });
    }
}

module.exports = BattleDetailsCommand;
