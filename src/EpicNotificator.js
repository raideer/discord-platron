const Twitter = require('twitter');
const winston = require('winston');
const Promise = require('bluebird');
const request = require('request-promise');
const uu = require('url-unshort')();
const utils = require('./utils');
const { RichEmbed } = require('discord.js');

module.exports = class EpicNotificator {
    constructor(client) {
        this.client = client;
    }

    _parseTweet(tweet) {
        const regex = new RegExp('Division ([1-4]) - Region: ([a-zA-Z ]+) - Battlefield: ([^ ]+) *- Timeleft: ([0-9]+) min');
        return tweet.match(regex);
    }

    _getBattleId(url) {
        const regex = new RegExp('/([0-9]+)$');
        const match = url.match(regex);
        if (match) {
            return match[1];
        }
    }

    async _notify(division, region, url, time) {
        let link = '';
        try {
            link = await uu.expand(url);

            if (!link) {
                link = url;
            }
        } catch (e) {
            link = url;
        }

        await Promise.each(this.client.guilds.array(), async guild => {
            const Role = this.client.databases.roles.table;
            const channel = await this.client.guildConfig(guild, 'epicNotificator', false);

            const guildChannel = guild.channels.get(channel);

            if (!guildChannel) {
                return;
            }

            if (guildChannel.type != 'text') {
                return;
            }

            const role = await Role.findOne({
                where: {
                    guildId: guild.id,
                    name: `div${division}`
                }
            });

            let divText = `**Division ${division}**`;

            if (role) {
                divText = `<@&${role.id}>`;
            }

            const battleId = this._getBattleId(link);
            const embed = new RichEmbed();

            if (!battleId) {
                await guildChannel.send(`:gem: ${divText} Epic battle in **${region}** :alarm_clock: ${time} min left :link: <${link}>`);
                return;
            }

            const data = await request({
                method: 'GET',
                json: true,
                uri: `https://api.erepublik-deutschland.de/${this.client.env('EREP_API')}/battles/details/${battleId}`
            });

            if (data.status == 'ok') {
                const battle = data.details[Object.keys(data.details)[0]];

                embed.setTitle(`:gem: Division ${division} Epic battle`);
                embed.addField('Attacker', `${utils.getFlag(battle.attacker.name)} **${battle.attacker.name}**`, true);
                embed.addField('Defender', `${utils.getFlag(battle.defender.name)} **${battle.defender.name}**`, true);
                embed.addField('Region', `:map: ${region}`, true);
                embed.addField('Time left', `:alarm_clock: ${time} minutes`, true);
                embed.addField('Battle type', `${battle.general.type}`, true);
                embed.addField('Round', `${battle.general.round}`, true);
                embed.addField('URL', `<${link}>`);
                embed.setURL(link);
                embed.setColor(utils.strToColor(division));

                if (battle.combat_orders) {
                    const cos = [];

                    for (const i in battle.combat_orders) {
                        let co = battle.combat_orders[i];
                        co = co[Object.keys(co)[0]];

                        if (co.division != division) {
                            continue;
                        }

                        cos.push(`${utils.getFlag(co.country.name)} ${co.country.name} | **${co.reward} cc/m** under **${co.wall}%** wall (${co.budget}cc budget)`);
                    }

                    if (cos.length > 0) {
                        embed.addField('Combat orders', cos.join('\n'));
                    }
                }

                await guildChannel.send(role ? `<@&${role.id}>` : '', { embed });
            }
        });
    }

    run() {
        const options = {
            consumer_key: this.client.env('TWITTER_CONSUMER_KEY'),
            consumer_secret: this.client.env('TWITTER_CONSUMER_SECRET'),
            access_token_key: this.client.env('TWITTER_TOKEN'),
            access_token_secret: this.client.env('TWITTER_SECRET')
        };

        winston.info('Creating twitter stream', options);

        const client = new Twitter(options);
        // 3304107645 4219664914
        this.stream = client.stream('statuses/filter', { follow: 3304107645 });
        this.stream.on('data', tweet => {
            const [_text, division, region, url, time] = this._parseTweet(tweet.text);

            this._notify(division, region, url, time);
        });

        this.stream.on('error', err => {
            throw err;
        });
    }
};
