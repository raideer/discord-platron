const Command = require('../PlatronCommand');
const BattleEye = require('../BattleEye');
const { Collection } = require('discord.js');
const AsciiTable = require('ascii-table');
const ErepublikData = require('../ErepublikData');

class BattleEyeCommand extends Command {
    constructor() {
        super('battleeye', {
            aliases: ['be', 'battleeye'],
            description: () => {
                // return this.client._('command.about.description');
            },
            args: [
                {
                    id: 'battleId',
                    type: 'dynamicInt'
                },
                {
                    id: 'round',
                    type: async (word, message, args) => {
                        if (Number.isInteger(word)) {
                            return Number(word);
                        }
                        const nbp = await BattleEye.getNbpStats(args.battleId);
                        return Object.keys(nbp.stats.current)[0];
                    }
                }
            ],
            usage: 'battleeye [battle_id] [round]',
            cooldown: 60000,
            showInHelp: false
        });
    }

    async exec(message, args) {
        const data = await BattleEye.loadStats(args.battleId, args.round);
        const countryStats = {};
        countryStats[data.leftId] = new Collection();
        countryStats[data.rightId] = new Collection();

        ['left', 'right'].forEach(side => {
            data[side].forEach(division => {
                division.damage.forEach(player => {
                    if (!countryStats[player.for_country_id].has(player.country_permalink)) {
                        countryStats[player.for_country_id].set(player.country_permalink, {
                            damage: 0,
                            players: 0,
                            country: player.country_name,
                            kills: 0
                        });
                    }

                    const stats = countryStats[player.for_country_id].get(player.country_permalink);
                    stats.damage += Number(String(player.value).replace(/[^0-9]/g, ''));
                    stats.players++;
                });

                division.kills.forEach(player => {
                    const stats = countryStats[player.for_country_id].get(player.country_permalink);
                    stats.kills += Number(String(player.value).replace(/[^0-9]/g, ''));
                });
            });
        });

        countryStats[data.leftId] = countryStats[data.leftId].sort((a, b) => {
            return a.damage < b.damage;
        });

        countryStats[data.rightId] = countryStats[data.rightId].sort((a, b) => {
            return a.damage < b.damage;
        });

        const leftTable = new AsciiTable(`Top 10 Stats for ${ErepublikData.countryIdToName(data.leftId)} (round ${args.round})`);
        leftTable.setHeading('Country', 'Damage', 'Kills');

        let rows = 0;
        countryStats[data.leftId].forEach(country => {
            if (rows < 10) {
                leftTable.addRow(country.country, country.damage.toLocaleString(), country.kills.toLocaleString());
            }

            rows++;
        });

        rows = 0;
        const rightTable = new AsciiTable(`Top 10 Stats for ${ErepublikData.countryIdToName(data.rightId)} (round ${args.round})`);
        rightTable.setHeading('Country', 'Damage', 'Kills');

        countryStats[data.rightId].forEach(country => {
            if (rows < 10) {
                rightTable.addRow(country.country, country.damage.toLocaleString(), country.kills.toLocaleString());
            }

            rows++;
        });

        message.channel.send(`\`${leftTable.toString()}\`\n\`${rightTable.toString()}\``);
    }
}

module.exports = BattleEyeCommand;
