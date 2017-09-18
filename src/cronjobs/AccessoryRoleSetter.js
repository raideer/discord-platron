const CronModule = require('../CronModule');
const Promise = require('bluebird');
const winston = require('winston');
const request = require('request-promise');
const _ = require('lodash');

module.exports = class AccessoryRoleSetter extends CronModule {
    constructor() {
        super('accessoryRoleSetter', {
            tab: () => {
                return this.client.env('ACCESSORY_ROLE_SETTER', '*/5 * * * *');
            }
        });
    }

    async _addVerifiedRole(guild, citizen) {
        const role = await this.utils.findOrCreateRole('roleVerified', 'roleVerified', guild, {
            name: 'Registered',
            color: '#5e9e11'
        });

        if (citizen.citizen.verified) {
            await citizen.member.addRole(role);
            winston.info('Added verified role to', citizen.member.user.username);
        } else {
            await citizen.member.removeRole(role);
            winston.info('Removed verified role from', citizen.member.user.username);
        }
    }

    async _processGuild(guild) {
        const apiKey = this.client.env('EREP_API');
        const citizens = await this.utils.getCitizensInGuild(guild);

        const ids = citizens.array().map(ob => {
            return ob.citizen.id;
        });

        if (ids.length <= 0) {
            return winston.info('No citizens in guild', guild.name);
        }

        const chunks = _.chunk(ids, 20);
        let data = null;

        await Promise.each(chunks, async (chunk, i, len) => {
            const chunkData = await request({
                method: 'GET',
                json: true,
                uri: `https://api.erepublik-deutschland.de/${apiKey}/players/details/${chunk.join(',')}`
            });

            data = _.merge(data, chunkData);

            if ((i + 1) < len) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        });

        console.log(data);

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
