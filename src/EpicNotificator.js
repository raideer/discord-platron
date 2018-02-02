const PushBullet = require('pushbullet');
const winston = require('winston');
const Promise = require('bluebird');
const request = require('request-promise');
const uu = require('url-unshort')();
const { RichEmbed } = require('discord.js');

// Singleton
let that;
module.exports = class EpicNotificator {
    constructor(client) {
        this.client = client;

        if (that) {
            return that;
        }

        winston.info('Creating pushbullet instance', this.client.env('PUSHBULLET_API_KEY'));

        this.pusher = new PushBullet(this.client.env('PUSHBULLET_API_KEY'));

        that = this;
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

    run() {
        winston.info('Creating pushbullet stream');

        this.stream = this.pusher.stream();
        this.stream.on('connect', () => {
            winston.info('Connected to Pushbullet');
        });

        this.stream.on('close', () => {
            winston.error('Pushbullet stream closed');
        });

        this.stream.on('error', e => {
            winston.error('Pushbullet stream returned an error', e);
        });

        this.stream.on('tickle', async type => {
            if (type !== 'push') return;
            winston.info('Received a push tickle. Fetching latest push');
            const data = await this._getLatestPush();
            const push = data.pushes[0];

            const _pushBody = this._parseBody(push.title, push.body);
            if (!_pushBody) return;
            const [_text, division, region, url, time] = _pushBody;
            winston.info('Notifying push');
            await this._notify(division, region, url, time);
        });

        this.stream.connect();
    }

    async _getLatestPush() {
        const data = await request({
            method: 'GET',
            json: true,
            uri: 'https://api.pushbullet.com/v2/pushes?limit=1',
            headers: {
                'Access-Token': this.client.env('PUSHBULLET_API_KEY')
            }
        });

        return data;
    }
};
