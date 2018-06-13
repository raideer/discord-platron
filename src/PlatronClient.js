const { AkairoClient } = require('discord-akairo');
const CronHandler = require('./CronHandler');
const { RichEmbed } = require('discord.js');
const PlatronUtils = require('./utils');
const ErepublikData = require('./ErepublikData');
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
        if (!guild) return defaultValue;
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
        winston.info('Notifying', data.div, 'epic');

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
                    name: `div${data.div}`
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
                divText = `**Division ${data.div}**`;
            }

            const embed = new RichEmbed();

            embed.setTitle(`:gem: Division ${data.div} Epic battle`);
            const attackerName = ErepublikData.countryIdToName(data.battle.inv.id);
            const defenderName = ErepublikData.countryIdToName(data.battle.def.id);
            embed.addField('Attacker', `${this.platron_utils.getFlag(attackerName)} **${attackerName}**`, true);
            embed.addField('Defender', `${this.platron_utils.getFlag(defenderName)} **${defenderName}**`, true);
            embed.addField('Region', `:map: ${data.battle.region.name}`, true);
            embed.addField('Time left', `:alarm_clock: ~${data.timeLeft} minutes`, true);
            embed.addField('Battle type', `${data.battle.war_type}`, true);
            embed.addField('Round', `${data.battle.zone_id}`, true);
            const battleUrl = `https://www.erepublik.com/en/military/battlefield/${data.battle.id}`;
            embed.addField('URL', battleUrl);
            embed.setURL(battleUrl);
            embed.setColor(this.platron_utils.strToColor(data.div));

            winston.info('Notified div', data.div, 'epic');
            await guildChannel.send(divText, { embed });
        });
    }
};
