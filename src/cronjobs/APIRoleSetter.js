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

    async _processGuild(guild, citizens) {
        const apiKey = this.client.env('EREP_API');
        if (!citizens) {
            citizens = await this.client.platron_utils.getCitizensInGuild(guild);
        }

        const ids = citizens.array().map(ob => {
            return ob.citizen.id;
        });

        if (ids.length <= 0) {
            return winston.info('No citizens in guild', guild.name);
        }

        const chunks = _.chunk(ids, 10);
        let data = null;

        await Promise.each(chunks, async (chunk, i, len) => {
            const chunkData = await request({
                method: 'GET',
                json: true,
                uri: `https://api.erepublik-deutschland.de/${apiKey}/players/details/${chunk.join(',')}`
            });

            data = _.merge(data, chunkData);

            winston.verbose(data);

            if ((i + 1) < len) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        });

        winston.info('Collected data for', Object.keys(data.players).length, 'players');

        const partyRoleEnabled = await this.client.guildConfig(guild, 'setPartyRoles', false, true);
        const verifiedRoleEnabled = await this.client.guildConfig(guild, 'setVerifiedRoles', false, true);
        const countryRoleEnabled = await this.client.guildConfig(guild, 'setCountryRoles', false, true);
        const divisionRoleEnabled = await this.client.guildConfig(guild, 'setDivisionRoles', false, true);
        const muRoleEnabled = await this.client.guildConfig(guild, 'setMURoles', false, true);

        let countryRole = await this.client.guildConfig(guild, 'countryRole', false);

        if (countryRole == '0') {
            countryRole = false;
        }

        if (verifiedRoleEnabled) {
            winston.verbose('Setting verified roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    await this._addVerifiedRole(guild, citizen);
                } catch (e) {
                    winston.error(e);
                }
            });
        } else {
            winston.info('Verified roles are disabled in', guild.name);
        }

        if (countryRoleEnabled) {
            winston.verbose('Setting country roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    const player = data.players[citizen.citizen.id];
                    await this._addCountryRole(guild, citizen, player);
                } catch (e) {
                    winston.error(e);
                }
            });
        } else {
            winston.info('Country roles are disabled in', guild.name);
        }

        if (divisionRoleEnabled) {
            winston.verbose('Setting division roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    const player = data.players[citizen.citizen.id];
                    await this._addDivisionRole(guild, citizen, player, countryRole);
                } catch (e) {
                    winston.error(e);
                }
            });
        } else {
            winston.info('Division roles are disabled in', guild.name);
        }

        if (partyRoleEnabled) {
            winston.info('Adding party roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    const player = data.players[citizen.citizen.id];
                    // console.log(player);
                    await this._addPartyRole(guild, citizen, player, countryRole);
                } catch (e) {
                    winston.error('Error adding party role for', citizen.citizen.id);
                }
            });
        } else {
            winston.info('Party roles are disabled in', guild.name);
        }

        if (muRoleEnabled) {
            winston.verbose('Setting MU roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    if (countryRole && !citizen.member.roles.has(countryRole)) {
                        return;
                    }

                    const player = data.players[citizen.citizen.id];
                    await this._addMURole(guild, citizen, player, countryRole);
                } catch (e) {
                    winston.error(e);
                }
            });
        } else {
            winston.info('MU roles are disabled in', guild.name);
        }
    }

    async _addVerifiedRole(guild, citizen) {
        const role = await this.client.platron_utils.findOrCreateRole('roleVerified', 'roleVerified', guild, {
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

    async _addDivisionRole(guild, citizen, citizenInfo, countryRole = false) {
        const divisionRoles = await this.client.platron_utils.getRolesWithGroup('division');

        if (!citizen.citizen.verified) {
            await citizen.member.removeRoles(divisionRoles);
            return;
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            await citizen.member.removeRoles(divisionRoles);
            return;
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(divisionrole)');
        }

        const role = await this.client.platron_utils.findOrCreateRole(`div${citizenInfo.military.division}`, 'division', guild, {
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

    async _addPartyRole(guild, citizen, citizenInfo, countryRole = false) {
        const roleKeys = await this.client.platron_utils.getRolesWithGroup('party');

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            await citizen.member.removeRoles(roleKeys);
            return;
        }

        if (citizenInfo.party && citizen.citizen.verified) {
            const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.party.name).toLowerCase(), 'party', guild, {
                name: citizenInfo.party.name,
                color: '#923dff'
            });

            // Get all parties that the member does not belong to
            const otherParties = roleKeys.filter(key => {
                return key != role.id;
            });

            await citizen.member.removeRoles(otherParties);
            await citizen.member.addRole(role);
        } else {
            // If not a member of any party, remove all party roles
            await citizen.member.removeRoles(roleKeys);
        }
    }

    async _addMURole(guild, citizen, citizenInfo, countryRole) {
        const muRoles = await this.client.platron_utils.getRolesWithGroup('mu');

        if (!citizen.citizen.verified) {
            await citizen.member.removeRoles(muRoles);
            return;
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            await citizen.member.removeRoles(muRoles);
            return;
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(mu)');
        }

        const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.military_unit.name).toLowerCase(), 'mu', guild, {
            name: citizenInfo.military_unit.name,
            color: '#212121'
        });

        const otherMUs = muRoles.filter(key => {
            return key != role.id;
        });

        await citizen.member.removeRoles(otherMUs);
        await citizen.member.addRole(role);
        winston.info('Added MU role for', citizen.member.user.username);
    }

    async _addCountryRole(guild, citizen, citizenInfo) {
        const countryRoles = await this.client.platron_utils.getRolesWithGroup('country');

        if (!citizen.citizen.verified) {
            winston.verbose(citizen.citizen.id, 'Not verified');
            await citizen.member.removeRoles(countryRoles);
            return;
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(countryrole)');
        }

        const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.citizenship.country_name).toLowerCase(), 'country', guild, {
            name: citizenInfo.citizenship.country_name,
            color: '#af900f'
        });

        winston.verbose('Country role', role);

        const otherCountries = countryRoles.filter(key => {
            return key != role.id;
        });

        winston.verbose('Removing other roles');
        await citizen.member.removeRoles(otherCountries);
        await citizen.member.addRole(role);
        winston.info('Added country role for', citizen.member.user.username);
    }
};
