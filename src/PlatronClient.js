const { AkairoClient } = require('discord-akairo');
const CronHandler = require('./CronHandler');
const { RichEmbed } = require('discord.js');
const PlatronUtils = require('./utils');
const Localize = require('localize');
const Promise = require('bluebird');
const winston = require('winston');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

module.exports = class PlatronClient extends AkairoClient {
    constructor(options, clientOptions) {
        super(options, clientOptions);

        this.databases = {};
        this.platron_utils = new PlatronUtils(this);
        this.auth = {};
    }

    build() {
        const translations = JSON.parse(fs.readFileSync(path.join(__dirname, '/../translations.json')));
        if (!translations) {
            throw 'Failed to parse translations.json';
        }

        const localize = new Localize(translations, null, 'machine');
        this.localize = localize;

        if (this.akairoOptions.cronDirectory) {
            this.cronHandler = new CronHandler(this, this.akairoOptions);
        } else {
            winston.warn('Cron module is not set up');
        }

        super.build();

        this._addCitizenIdType();

        return this;
    }

    async guildConfig(guild, key, defaultValue = null, isBoolean = false) {
        const Config = this.databases.config.table;
        const val = await Config.findOrCreate({
            where: {
                field: key,
                guild_id: guild.id
            },
            defaults: {
                value: defaultValue
            }
        });

        if (isBoolean) {
            return _.first(val).value == 1;
        }

        return _.first(val).value;
    }

    _addCitizenIdType() {
        this.commandHandler.resolver.addType('citizenId', async (word, message) => {
            const id = await this.platron_utils.resolveCitizenId(word, message.author.id, message.guild);
            return id;
        });
    }

    setDatabase(name, provider) {
        this.databases[name] = provider;
    }

    getDatabase(name) {
        return this.databases[name];
    }

    loadAll() {
        super.loadAll();
        if (this.cronHandler) this.cronHandler.loadAll();
    }

    _(...args) {
        if (!this.localize) return;
        return this.localize.translate.apply(null, args);
    }

    env(key, defaultValue = null) {
        if (process.env[key]) {
            if (process.env[key] == 'true') {
                return true;
            } else if (process.env[key] == 'false') {
                return false;
            }

            return process.env[key];
        }

        if (typeof defaultValue === 'function') {
            return defaultValue.call(this);
        }

        return defaultValue;
    }

    async notifyEpic(data) {
        winston.info('Notifying', data.division, 'epic');
        await Promise.each(this.guilds.array(), async guild => {
            const Role = this.databases.roles.table;
            const channel = await this.guildConfig(guild, 'epicNotificator', false);

            const guildChannel = guild.channels.get(channel);
            if (!guildChannel) return;

            const maveric = await this.guildConfig(guild, 'notifyMaverics', false);

            if (guildChannel.type != 'text') {
                return;
            }

            const role = await Role.findOne({
                where: {
                    guildId: guild.id,
                    name: `div${data.division}`
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
                divText = `**Division ${data.division}**`;
            }

            const embed = new RichEmbed();

            if (!data.details) {
                await guildChannel.send(`:gem: ${divText} Epic battle in **${data.region}** :alarm_clock: ${data.time} min left :link: <${data.url}>`);
                return;
            }

            embed.setTitle(`:gem: Division ${data.division} Epic battle`);
            embed.addField('Attacker', `${this.platron_utils.getFlag(data.details.attacker.name)} **${data.details.attacker.name}**`, true);
            embed.addField('Defender', `${this.platron_utils.getFlag(data.details.defender.name)} **${data.details.defender.name}**`, true);
            embed.addField('Region', `:map: ${data.region}`, true);
            embed.addField('Time left', `:alarm_clock: ${data.time} minutes`, true);
            embed.addField('Battle type', `${data.details.general.type}`, true);
            embed.addField('Round', `${data.details.general.round}`, true);
            embed.addField('URL', `<${data.url}>`);
            embed.setURL(data.url);
            embed.setColor(this.platron_utils.strToColor(data.division));

            if (data.details.combat_orders) {
                const cos = [];

                for (const i in data.details.combat_orders) {
                    let co = data.details.combat_orders[i];
                    co = co[Object.keys(co)[0]];

                    if (co.division != data.division) {
                        continue;
                    }

                    cos.push(`${this.platron_utils.getFlag(co.country.name)} ${co.country.name} | **${co.reward} cc/m** under **${co.wall}%** wall (${co.budget}cc budget)`);
                }

                if (cos.length > 0) {
                    embed.addField('Combat orders', cos.join('\n'));
                }
            }

            winston.info('Notified div', data.division, 'epic');
            await guildChannel.send(divText, { embed });
        });
    }
};
