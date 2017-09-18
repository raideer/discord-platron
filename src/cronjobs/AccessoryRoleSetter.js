const CronModule = require('../CronModule');
const { Collection } = require('discord.js');
const Promise = require('bluebird');
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
        const citizens = await Citizen.findAll({
            where: {
                verified: true
            }
        });
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

    async _addVerifiedRole(guild, citizen) {
        if (citizen.citizen.verified) {
            const role = await this.roleUtils.findOrCreateRole('roleVerified', 'roleVerified', guild, {
                name: 'Verified by PlaTRON',
                color: '#5e9e11'
            });

            await citizen.member.addRole(role);
            winston.info('Added verified role to', citizen.member.user.username);
        }
    }

    async _processGuild(guild) {
        const apiKey = this.client.env('EREP_API');
        const citizens = await this._getCitizensInGuild(guild);

        const ids = citizens.array().map(ob => {
            return ob.citizen.id;
        });

        if (ids.length <= 0) {
            return winston.info('No citizens in guild', guild.name);
        }

        const data = await request({
            method: 'GET',
            json: true,
            uri: `https://api.erepublik-deutschland.de/${apiKey}/players/details/${ids.join(',')}`
        });

        const verifiedRoleEnabled = await this.client.guildConfig(guild, 'setVerifiedRoles', false);

        if (verifiedRoleEnabled == '1') {
            winston.verbose('Setting verified roles');
            await Promise.each(citizens.array(), async citizen => {
                const player = data.players[citizen.citizen.id];
                await this._addVerifiedRole(guild, citizen, player);
            });
        } else {
            winston.info('Verified roles are disabled in', guild.name);
        }
    }

    async exec() {
        await Promise.each(this.client.guilds.array(), async guild => {
            winston.info('Setting accessory roles for guild', guild.name);
            const timer = winston.startTimer();
            await this._processGuild(guild);
            timer.done(`Finished setting accessory roles for guild ${guild.name}`);
        });
    }
};
