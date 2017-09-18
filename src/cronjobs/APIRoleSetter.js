const CronModule = require('../CronModule');
const Promise = require('bluebird');
const winston = require('winston');
const request = require('request-promise');
const _ = require('lodash');
const slugify = require('slugify');

module.exports = class APIRoleSetter extends CronModule {
    constructor() {
        super('apiRoleSetter', {
            tab: () => {
                return this.client.env('API_ROLE_SETTER', '*/5 * * * *');
            }
        });
    }

    async exec() {
        await Promise.each(this.client.guilds.array(), async guild => {
            winston.info('Setting accessory roles for guild', guild.name);
            const timer = winston.startTimer();
            await this._processGuild(guild);
            timer.done(`Finished setting accessory roles for guild ${guild.name}`);
        });
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

        winston.info('Collected data for', Object.keys(data).length, 'players');

        const verifiedRoleEnabled = await this.client.guildConfig(guild, 'setVerifiedRoles', false);
        const countryRoleEnabled = await this.client.guildConfig(guild, 'setCountryRoles', false);
        const divisionRoleEnabled = await this.client.guildConfig(guild, 'setDivisionRoles', false);

        if (verifiedRoleEnabled == '1') {
            winston.verbose('Setting verified roles');
            await Promise.each(citizens.array(), async citizen => {
                await this._addVerifiedRole(guild, citizen);
            });
        } else {
            winston.info('Verified roles are disabled in', guild.name);
        }

        if (countryRoleEnabled == '1') {
            winston.verbose('Setting country roles');
            await Promise.each(citizens.array(), async citizen => {
                const player = data.players[citizen.citizen.id];
                await this._addCountryRole(guild, citizen, player);
            });
        } else {
            winston.info('Country roles are disabled in', guild.name);
        }

        if (divisionRoleEnabled == '1') {
            winston.verbose('Setting division roles');
            await Promise.each(citizens.array(), async citizen => {
                const player = data.players[citizen.citizen.id];
                await this._addDivisionRole(guild, citizen, player);
            });
        } else {
            winston.info('Division roles are disabled in', guild.name);
        }
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

    async _addDivisionRole(guild, citizen, citizenInfo) {
        const divisionRoles = await this.utils.getRolesWithGroup('division');

        if (!citizen.citizen.verified) {
            await citizen.member.removeRoles(divisionRoles);
            return;
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(divisionrole)');
        }

        const role = await this.utils.findOrCreateRole(`div${citizenInfo.military.division}`, 'division', guild, {
            name: `DIV ${citizenInfo.military.division}`,
            color: '#0faf8d'
        });

        const otherDivisions = divisionRoles.filter(key => {
            return key != role.id;
        });

        await citizen.member.removeRoles(otherDivisions);
        await citizen.member.addRole(role);
        winston.info('Added division role for', citizen.member.user.username);
    }

    async _addCountryRole(guild, citizen, citizenInfo) {
        const countryRoles = await this.utils.getRolesWithGroup('country');

        if (!citizen.citizen.verified) {
            await citizen.member.removeRoles(countryRoles);
            return;
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(countryrole)');
        }

        const role = await this.utils.findOrCreateRole(slugify(citizenInfo.citizenship.country_name).toLowerCase(), 'country', guild, {
            name: citizenInfo.citizenship.country_name,
            color: '#af900f'
        });

        const otherCountries = countryRoles.filter(key => {
            return key != role.id;
        });

        await citizen.member.removeRoles(otherCountries);
        await citizen.member.addRole(role);
        winston.info('Added country role for', citizen.member.user.username);
    }
};
