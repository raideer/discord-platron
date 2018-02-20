const CronModule = require('../CronModule');
const Promise = require('bluebird');
const winston = require('winston');
const request = require('request-promise');
const _ = require('lodash');
const moment = require('moment');
const { RichEmbed } = require('discord.js');
const uu = require('url-unshort')();


module.exports = class EpicNotificator extends CronModule {
    constructor() {
        super('epicNotificator', {
            tab: () => {
                return this.client.env('EPIC_NOTIFICATOR_CRON', '*/30 * * * * *');
            }
        });
    }

    async exec() {
        const Push = this.client.databases.push.table;
        const response = await this._getLatestPush(10);
        response.pushes.forEach(push => {
            const pushTime = moment.unix(push.created);
            const diff = pushTime.diff(moment.now(), 'seconds');
            if (diff >= -60) {
                Push.findOrCreate({
                    where: {
                        id: push.iden
                    },
                    defaults: {
                        id: push.iden
                    }
                }).spread((p, created) => {
                    winston.verbose('New push. Unique:', created);
                    if (created) {
                        const _pushBody = this._parseBody(push.title, push.body);
                        if (!_pushBody) return;
                        const [_text, division, region, url, time] = _pushBody;
                        winston.info('Notifying push');
                        this._notify(division, region, url, time);
                    }
                });
            }
        });
    }

    _parseBody(title, body) {
        const str = `${title} - ${body}`;
        const regex = new RegExp('Division ([1-4]) - Region: (.+?) - Battlefield: ([^ ]+) *- Timeleft: ([0-9]+) min');
        const match = str.match(regex);
        if (!match) {
            winston.error('Invalid push body', body);
            return null;
        }

        return match;
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
            if (!guildChannel) return;

            const maveric = await this.client.guildConfig(guild, 'notifyMaverics', false);

            if (guildChannel.type != 'text') {
                return;
            }

            const role = await Role.findOne({
                where: {
                    guildId: guild.id,
                    name: `div${division}`
                }
            });

            let divText = '';
            if (role || maveric != 0) {
                if (role) {
                    divText += ` <@&${role.id}>`;
                }
                if (maveric != 0) {
                    divText += ` <@&${maveric}>`;
                }
            } else {
                divText = `**Division ${division}**`;
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
                embed.addField('Attacker', `${this.client.platron_utils.getFlag(battle.attacker.name)} **${battle.attacker.name}**`, true);
                embed.addField('Defender', `${this.client.platron_utils.getFlag(battle.defender.name)} **${battle.defender.name}**`, true);
                embed.addField('Region', `:map: ${region}`, true);
                embed.addField('Time left', `:alarm_clock: ${time} minutes`, true);
                embed.addField('Battle type', `${battle.general.type}`, true);
                embed.addField('Round', `${battle.general.round}`, true);
                embed.addField('URL', `<${link}>`);
                embed.setURL(link);
                embed.setColor(this.client.platron_utils.strToColor(division));

                if (battle.combat_orders) {
                    const cos = [];

                    for (const i in battle.combat_orders) {
                        let co = battle.combat_orders[i];
                        co = co[Object.keys(co)[0]];

                        if (co.division != division) {
                            continue;
                        }

                        cos.push(`${this.client.platron_utils.getFlag(co.country.name)} ${co.country.name} | **${co.reward} cc/m** under **${co.wall}%** wall (${co.budget}cc budget)`);
                    }

                    if (cos.length > 0) {
                        embed.addField('Combat orders', cos.join('\n'));
                    }
                }

                await guildChannel.send(divText, { embed });
            }
        });
    }

    async _getLatestPush(num = 1) {
        const data = await request({
            method: 'GET',
            json: true,
            uri: `https://api.pushbullet.com/v2/pushes?limit=${num}`,
            headers: {
                'Access-Token': this.client.env('PUSHBULLET_API_KEY')
            }
        });

        return data;
    }
};
