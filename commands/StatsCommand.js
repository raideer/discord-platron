const { Command } = require('discord-akairo');
const { getFlag, number, strToColor, citizenNameToId } = require('../utils');
const request = require('request');
const { RichEmbed } = require('discord.js');
const _ = require('underscore');
const AsciiTable = require('ascii-table');

class StatsCommand extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats'],
            args: [
                {
                    id: 'user',
                    type: 'string',
                    match: 'rest',
                    default: (message) => {
                        return new Promise((resolve, reject) => {
                            this.client.databases.citizens.table.findOne({where: {discord_id: message.author.id}})
                            .then((user) => {
                                if (!user) {
                                    message.reply('Please enter a valid username/user id or register (via !register) to look up your own stats');
                                    return reject();
                                }

                                return resolve(user.id);
                            });
                        });
                    }
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
                    return message.reply(`Player with ID \`${userId}\` was not found!`);
                }

                const player = data.players[userId];

                const embed = new RichEmbed();
                    embed.setTitle(`Stats for citizen **${player.name}** (${player.citizen_id})`);
                    embed.setURL(`https://www.erepublik.com/en/citizen/profile/${player.citizen_id}`);
                    embed.addField('Level', player.general.level, true);
                    embed.addField('XP', number(player.general.experience_points), true);
                    embed.addField('Citizenship', `${getFlag(player.citizenship.country_name)} ${player.citizenship.country_name}`, true);
                    embed.addField('Location', `${getFlag(player.residence.country_name)} ${player.residence.region_name} (${player.residence.country_name})`, true);
                    if (player.party.id) {
                        embed.addField('Party', `[${player.party.name}](https://www.erepublik.com/en/party/${player.party.id})`, true);
                    }

                    if (player.newspaper.id) {
                        embed.addField('Newspaper', `[${player.newspaper.name}](https://www.erepublik.com/en/newspaper/${player.newspaper.id})`, true);
                    }

                    if (player.military_unit.id) {
                        embed.addField('Military unit', `[${player.military_unit.name}](https://www.erepublik.com/en/military/military-unit/${player.military_unit.id})`, true);
                    }
                    embed.addField('Division', player.military.division, true);
                    embed.addField('Strength', number(player.military.strength), true);
                    embed.addField('Perception', number(player.military.perception), true);
                    embed.addField('Rank', `__${player.military.rank_name}__ (${number(player.military.rank_points)} points)`, true);
                    embed.addField('Aircraft rank', `__${player.military.rank_name_aircraft}__ (${number(player.military.rank_points_aircraft)} points)`, true);
                    embed.addField('Max hit', `${number(player.military.maxhit)} | ${number(player.military.maxhit_aircraft)} (air)`, true);

                    const tableLeft = new AsciiTable();
                    const tableRight = new AsciiTable();

                    let leftSide = Object.keys(player.achievements);
                    leftSide = leftSide.filter((name) => {
                        return player.achievements[name] > 0;
                    });

                    const rightSide = leftSide.splice(0, Math.floor(leftSide.length / 2));

                    for (let i in leftSide) {
                        let a = leftSide[i];
                        tableLeft.addRow(this.prettifyAchievement(a), player.achievements[a]);
                    }

                    for (let i in rightSide) {
                        let a = rightSide[i];
                        tableRight.addRow(this.prettifyAchievement(a), player.achievements[a]);
                    }

                    embed.addField('Achievements', `\`${tableLeft.toString()}\``, true);
                    embed.addField('Achievements', `\`${tableRight.toString()}\``, true);

                    embed.setColor(strToColor(player.citizenship.country_name));

                embed.setThumbnail(`https://www.erepublik-deutschland.de/api/playerapi.php?p=pidavatar&s=${player.citizen_id}`);

                message.channel.send({
                    embed: embed
                });
            }
        });
    }

    exec(message, args) {
        this.client.env('EREP_API', () => {
            throw "eRepublik Deutchland API key is not set!";
        });

        if (Number.isInteger(Number(args.user))) {
            this.showStats(message, args.user);
        } else {
            citizenNameToId(args.user).then((id) => {
                this.showStats(message, id);
            }).catch((error) => {
                if (error) {
                    return message.reply('Something went wrong while processing your request');
                }

                return message.reply(`Citizen with name ${args.user} was not found`);
            });
        }
    }
}

module.exports = StatsCommand;
