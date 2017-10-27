const Command = require('../PlatronCommand');
const request = require('request');
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
            usage: 'stats (player name|citizen ID)',
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

    showStats(message, userId) {
        const apiKey = this.client.env('EREP_API');
        request.get(`https://api.erepublik-deutschland.de/${apiKey}/players/details/${userId}`, (error, response, body) => {
            if (error) {
                return message.reply('Something went wrong while processing your request');
            }

            const data = JSON.parse(body);

            if (data.status == 'ok') {
                if (!(userId in data.players)) {
                    return message.reply(this.client._('command.register.user_not_found', `**${userId}**`));
                }

                const player = data.players[userId];

                const embed = new RichEmbed();
                embed.setTitle(this.client._('command.stats.title', `**${player.name}** (${player.citizen_id})`));
                embed.setURL(`https://www.erepublik.com/en/citizen/profile/${player.citizen_id}`);
                embed.setFooter(this.client._('command.stats.last_update', new Date(player.general.lastupdate).toLocaleString()));
                embed.addField(this.client._('command.stats.level'), player.general.level, true);
                embed.addField('XP', this.client.platron_utils.number(player.general.experience_points), true);
                embed.addField(this.client._('command.stats.citizenship'), `${this.client.platron_utils.getFlag(player.citizenship.country_name)} ${player.citizenship.country_name}`, true);
                embed.addField(this.client._('command.stats.location'), `${this.client.platron_utils.getFlag(player.residence.country_name)} ${player.residence.region_name} (${player.residence.country_name})`, true);
                if (player.party.id) {
                    embed.addField(this.client._('command.stats.party'), `[${player.party.name}](https://www.erepublik.com/en/party/${player.party.id})`, true);
                }

                if (player.newspaper.id) {
                    embed.addField(this.client._('command.stats.newspaper'), `[${player.newspaper.name}](https://www.erepublik.com/en/newspaper/${player.newspaper.id})`, true);
                }

                if (player.military_unit.id) {
                    embed.addField(this.client._('command.stats.mu'), `[${player.military_unit.name}](https://www.erepublik.com/en/military/military-unit/${player.military_unit.id})`, true);
                }
                embed.addField(this.client._('command.stats.division'), player.military.division, true);
                embed.addField(this.client._('command.stats.strength'), this.client.platron_utils.number(player.military.strength), true);
                embed.addField(this.client._('command.stats.perception'), this.client.platron_utils.number(player.military.perception), true);
                embed.addField(this.client._('command.stats.rank'), `__${player.military.rank_name}__ (${this.client.platron_utils.number(player.military.rank_points)} points)`, true);
                embed.addField(this.client._('command.stats.air_rank'), `__${player.military.rank_name_aircraft}__ (${this.client.platron_utils.number(player.military.rank_points_aircraft)} points)`, true);
                embed.addField(this.client._('command.stats.max_hit'), `${this.client.platron_utils.number(player.military.maxhit)} | ${this.client.platron_utils.number(player.military.maxhit_aircraft)} (air)`, true);

                const tableLeft = new AsciiTable();
                const tableRight = new AsciiTable();

                let leftSide = Object.keys(player.achievements);
                leftSide = leftSide.filter(name => {
                    return player.achievements[name] > 0;
                });

                const rightSide = leftSide.splice(0, Math.floor(leftSide.length / 2));

                for (const i in leftSide) {
                    const a = leftSide[i];
                    tableLeft.addRow(this.prettifyAchievement(a), player.achievements[a]);
                }

                for (const i in rightSide) {
                    const a = rightSide[i];
                    tableRight.addRow(this.prettifyAchievement(a), player.achievements[a]);
                }

                embed.addField(this.client._('command.stats.achievements'), `\`${tableLeft.toString()}\``, true);
                embed.addField(this.client._('command.stats.achievements'), `\`${tableRight.toString()}\``, true);

                embed.setColor(this.client.platron_utils.strToColor(player.citizenship.country_name));

                embed.setThumbnail(`https://www.erepublik-deutschland.de/api/playerapi.php?p=pidavatar&s=${player.citizen_id}`);

                message.channel.send({ embed });
            }
        });
    }

    exec(message, args) {
        this.client.env('EREP_API', () => {
            throw 'eRepublik Deutchland API key is not set!';
        });

        return this.showStats(message, args.citizenId);
    }
}

module.exports = StatsCommand;
