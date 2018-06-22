const SettingsProvider = require('./SettingsProvider');
const RolesProvider = require('./RolesProvider');

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
const db = require('../db/models/index');

module.exports = class PlatronClient extends AkairoClient {
    constructor() {
        super({
            ownerID: ['362625609538600971'],
            commandDirectory: './src/commands/',
            inhibitorDirectory: './src/inhibitors/',
            listenerDirectory: './src/listeners/',
            cronDirectory: './src/cronjobs/',
            handleEdits: false,
            defaultCooldown: 1000,
            commandUtil: true,
            prefix: message => {
                if (message.guild) {
                    const prefix = this.settings.get(message.guild, 'prefix', '!');
                    if (prefix) {
                        return prefix;
                    }
                }

                return '!';
            }
        }, {
            disableEveryone: true
        });

        this.databases = {};
        this.settings = new SettingsProvider(db.Settings);
        this.roles = new RolesProvider(db.Role);
        this.platron_utils = new PlatronUtils(this);
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
            const channel = await this.settings.get(guild, 'epicNotificator', false);

            const guildChannel = guild.channels.get(channel);
            if (!guildChannel) return;

            const maveric = await this.roles.get(guild, 'maveric', false);

            if (guildChannel.type != 'text') {
                return;
            }

            const role = this.roles.get(guild, `div${data.div}`);

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
