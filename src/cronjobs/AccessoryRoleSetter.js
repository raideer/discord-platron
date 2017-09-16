const CronModule = require('../CronModule');
const a = require('async');
const { Collection } = require('discord.js');
const Promise = require("bluebird");
const utils = require('../utils');
const winston = require('winston');
const request = require('request-promise');

module.exports = class AccessoryRoleSetter extends CronModule {
    constructor() {
        super('accessoryRoleSetter', {
            tab: () => {
                return this.client.env('ACCESSORY_ROLE_SETTER', '*/5 * * * *');
            }
        });
    }

    async _getCitizensInGuild(guild) {
        const Citizen = this.client.databases.citizens.table;
        const citizens = await Citizen.all();
        const filtered = new Collection();

        for (const i in citizens) {
            const citizen = citizens[i];
            if (guild.members.has(citizen.discord_id)) {
                filtered.set(citizen.id, {
                    citizen: citizen,
                    member: guild.members.get(citizen.discord_id)
                });
            }
        }

        return filtered;
    }

    async _processMember(guild, member, data) {

    }

    async _processGuild(guild) {
        const apiKey = this.client.env('EREP_API');
        const citizens = await this._getCitizensInGuild(guild);

        const ids = citizens.array().map(ob => {
            return ob.citizen.id;
        }).join(',');

        const data = await request({
            method: 'GET',
            json: true,
            uri: `https://api.erepublik-deutschland.de/${apiKey}/players/details/${ids}`
        });

        // const players = utils.objectToCollection(data.players);

        await Promise.each(citizens.array(), async citizen => {
            const player = data.players[citizen.citizen.id];

            if (!player) return;

            const verifiedRoleEnabled = await this.client.guildConfig(guild, 'setVerifiedRoles', false);

            if (verifiedRoleEnabled == '1') {

                console.log('Setting verified roles');
            }
        });
    }

    exec() {
        a.eachSeries(this.client.guilds.array(), (guild, cb) => {
            winston.info('Setting accessory roles for guild', guild.name);
            const timer = winston.startTimer();
            this._processGuild(guild).then(() => {
                timer.done(`Finished setting accessory roles for guild ${guild.name}`);
                cb();
            });
        });
    }
};
