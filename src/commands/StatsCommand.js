const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');
const AsciiTable = require('ascii-table');

class StatsCommand extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats'],
            cooldown: 60000,
            ratelimit: 30,
            description: () => {
                return this.client._('command.stats.description');
            },
            usage: [
                'stats <citizen_id>',
                'stats <citizen_name>'
            ],
            args: [
                {
                    id: 'citizenId',
                    type: 'citizenId',
                    match: 'rest'
                }
            ]
        });
    }

    prettifyAchievement(str) {
        let title = str.replace('_', ' ');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        return title;
    }

    async showStats(message, userId) {
        const data = await this.client.platron_utils.privateApi(`citizen/profile/${userId}`);
        // const data = await this.client.platron_utils.deutchlandApi(`players/details/${userId}`);
        if (!data) {
            return message.reply(this.client._('bot.invalid_request'));
        }

        if (data.type && data.type.endsWith('NotFoundException')) {
            return message.reply(this.client._('command.register.user_not_found', `**${userId}**`));
        }

        const player = data;

        const embed = new RichEmbed();
        embed.setTitle(this.client._('command.stats.title', `**${player.name}** (${player.id})`));
        embed.setURL(`https://www.erepublik.com/en/citizen/profile/${player.id}`);
        embed.addField(this.client._('command.stats.level'), player.level, true);
        embed.addField('XP', this.client.platron_utils.number(player.experience), true);
        embed.addField(this.client._('command.stats.citizenship'), `${this.client.platron_utils.getFlag(player.citizenship.name)} ${player.citizenship.name}`, true);
        embed.addField(this.client._('command.stats.location'), `${this.client.platron_utils.getFlag(player.residence.country.name)} ${player.residence.region.name} (${player.residence.country.name})`, true);
        if (player.party) {
            embed.addField(this.client._('command.stats.party'), `[${player.party.name}](https://www.erepublik.com/en/party/${player.party.id})`, true);
        }

        if (player.newspaper) {
            embed.addField(this.client._('command.stats.newspaper'), `[${player.newspaper.name}](https://www.erepublik.com/en/newspaper/${player.newspaper.id})`, true);
        }

        if (player.military.unit) {
            embed.addField(this.client._('command.stats.mu'), `[${player.military.unit.name}](https://www.erepublik.com/en/military/military-unit/${player.military.unit.id})`, true);
        }
        embed.addField(this.client._('command.stats.division'), player.division, true);
        embed.addField(this.client._('command.stats.strength'), this.client.platron_utils.number(player.military.strength), true);
        embed.addField(this.client._('command.stats.perception'), this.client.platron_utils.number(player.military.perception), true);
        embed.addField(this.client._('command.stats.rank'), `__${player.military.rank.name}__ (${this.client.platron_utils.number(player.military.rank.points)} points)`, true);
        embed.addField(this.client._('command.stats.air_rank'), `__${player.military.air_rank.name}__ (${this.client.platron_utils.number(player.military.air_rank.points)} points)`, true);

        const tableLeft = new AsciiTable();
        const tableRight = new AsciiTable();

        let leftSide = Object.keys(player.medals);
        leftSide = leftSide.filter(name => {
            return player.medals[name] > 0;
        });

        const rightSide = leftSide.splice(0, Math.floor(leftSide.length / 2));

        for (const i in leftSide) {
            const a = leftSide[i];
            tableLeft.addRow(this.prettifyAchievement(a), player.medals[a]);
        }

        for (const i in rightSide) {
            const a = rightSide[i];
            tableRight.addRow(this.prettifyAchievement(a), player.medals[a]);
        }

        embed.addField(this.client._('command.stats.achievements'), `\`${tableLeft.toString()}\``, true);
        embed.addField(this.client._('command.stats.achievements'), `\`${tableRight.toString()}\``, true);

        embed.setColor(this.client.platron_utils.strToColor(player.citizenship.name));

        embed.setThumbnail(`https://www.erepublik-deutschland.de/api/playerapi.php?p=pidavatar&s=${player.id}`);

        message.channel.send({ embed });
    }

    exec(message, args) {
        if (!args.citizenId) {
            this.client.platron_utils.invalidCommand(message, this);
        }

        return this.showStats(message, args.citizenId);
    }
}

module.exports = StatsCommand;
