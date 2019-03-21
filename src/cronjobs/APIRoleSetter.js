const CronModule = require('../CronModule');
const Promise = require('bluebird');
const winston = require('winston');
const request = require('request-promise');
const _ = require('lodash');
const slugify = require('slugify');

class APIRoleSetter extends CronModule {
    constructor() {
        super('apiRoleSetter', {
            tab: () => {
                return this.client.env('API_ROLE_SETTER', '*/5 * * * *');
            }
        });
    }

    async exec() {
        try {
            await Promise.each(this.client.guilds.array(), async guild => {
                winston.info('Setting API roles for guild', guild.name);
                const timer = winston.startTimer();
                await this._processGuild(guild);
                timer.done(`Finished setting API roles for guild ${guild.name}`);
            });
        } catch(e) {
            winston.error('Failed to run API role setter', e);
        }
    }

    async _processGuild(guild, citizens) {
        // const apiKey = this.client.env('EREP_API');
        if (!citizens) {
            citizens = await this.client.platron_utils.getCitizensInGuild(guild);
        }

        const ids = citizens.array().map(ob => {
            return ob.citizen.id;
        });

        if (ids.length <= 0) {
            return winston.info('No citizens in guild', guild.name);
        }

        // guild, configKey, default value, is value boolean
        const partyRoleEnabled = await this.client.settings.get(guild, 'setPartyRoles', false);
        const verifiedRoleEnabled = await this.client.settings.get(guild, 'setVerifiedRoles', false);
        const countryRoleEnabled = await this.client.settings.get(guild, 'setCountryRoles', false);
        const divisionRoleEnabled = await this.client.settings.get(guild, 'setDivisionRoles', false);
        const muRoleEnabled = await this.client.settings.get(guild, 'setMURoles', false);
        const mavericRoleEnabled = await this.client.settings.get(guild, 'setMavericRoles', false);

        let countryRole = await this.client.settings.get(guild, 'countryRole', false);

        if (countryRole == '0') {
            countryRole = false;
        }

        const roles = { mavericRoleEnabled, partyRoleEnabled, verifiedRoleEnabled, countryRoleEnabled, divisionRoleEnabled, muRoleEnabled, countryRole };

        const allDisabled = Object.keys(roles).every(role => !roles[role]);

        if (allDisabled) {
            return winston.info('All roles disabled in guild', guild.name);
        }

        const data = {};

        for (const id of ids) {
            try {
                const citizen = await this.client.platron_utils.getCitizenInfo(id);
                data[id] = citizen;
                await this.client.platron_utils.sleep(1000);
            } catch(e) {
                console.error('Could not fetch citizen data for', id);
            }
        }

        winston.info('Collected data for', Object.keys(data).length, 'players');

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

        const citizenChunks = _.chunk(citizens.array(), parseInt(this.client.env('RS_CHUNKS', 5)));

        await Promise.each(citizenChunks, chunk => {
            const citizenIds = chunk.map(playerData => {
                return playerData.citizen.id;
            });

            winston.verbose('Adding roles for', citizenIds.join(', '), 'in guild', guild.name);
            const promises = [];
            chunk.forEach(playerData => {
                promises.push(this._addRoles(guild, playerData, data, roles));
            });

            return Promise.all(promises);
        });
    }
    // end processGuilds

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

    async _addRoles(guild, citizen, apiData, roles) {
        const player = apiData[citizen.citizen.id];

        const actions = {
            remove: [],
            add: []
        };

        const mergeActions = a => {
            if (Array.isArray(a.remove)) {
                for (const removeRole of a.remove) {
                    const roleId = typeof removeRole == 'object' ? removeRole.id : removeRole;
                    // Remove only if member has the role
                    if (citizen.member.roles.has(roleId)) {
                        actions.remove.push(removeRole);
                    }
                }
            }

            if (Array.isArray(a.add)) {
                for (const addRole of a.add) {
                    const roleId = typeof addRole == 'object' ? addRole.id : addRole;
                    // Add only if member does not have the role
                    if (!citizen.member.roles.has(roleId)) {
                        actions.add.push(addRole);
                    }
                }
            }
        };

        // Add country role
        if (roles.countryRoleEnabled) {
            try {
                const a = await this._addCountryRole(guild, citizen, player);
                mergeActions(a);
            } catch (e) {
                winston.error(e);
            }
        }

        // Add division role
        if (roles.divisionRoleEnabled) {
            try {
                const a = await this._addDivisionRole(guild, citizen, player, roles.countryRole);
                mergeActions(a);
            } catch (e) {
                winston.error(e);
            }
        }

        // Add party role
        if (roles.partyRoleEnabled) {
            try {
                if (player.party) {
                    const a = await this._addPartyRole(guild, citizen, player, roles.countryRole);
                    mergeActions(a);
                }
            } catch (e) {
                winston.error('Error adding party role for', citizen.citizen.id);
            }
        }

        // Add MU role
        if (roles.muRoleEnabled) {
            try {
                if (player.military) {
                    const a = await this._addMURole(guild, citizen, player, roles.countryRole);
                    mergeActions(a);
                }
            } catch (e) {
                winston.error(e);
            }
        }

        // Add Maveric role
        if (roles.mavericRoleEnabled) {
            try {
                if (player.activePacks) {
                    const a = await this._addMavericRole(guild, citizen, player, roles.countryRole);
                    mergeActions(a);
                }
            } catch (e) {
                winston.error(e);
            }
        }

        this._runActions(citizen, actions);
    }

    async _runActions(citizen, actions) {
        if (actions.remove.length > 0) {
            await citizen.member.removeRoles(actions.remove);
        }

        if (actions.add.length > 0) {
            await citizen.member.addRoles(actions.add);
        }
    }

    async _addMavericRole(guild, citizen, citizenInfo, countryRole = false) {
        //roleName, roleGroup, guild, defaults
        const mavericRole = await this.client.platron_utils.findOrCreateRole('maveric', 'maveric', guild, {
            name: 'Maveric',
            color: '#d3a72c'
        });

        if (!citizen.citizen.verified) {
            winston.verbose('User not verified. Removing maveric role');
            return {
                remove: mavericRole
            };
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            return {
                remove: mavericRole
            };
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(mavericrole)');
        }

        if (citizenInfo.activePacks.division_switch_pack) {
            return {
                add: [mavericRole]
            };
        }

        return {
            remove: [mavericRole]
        };
    }

    async _addDivisionRole(guild, citizen, citizenInfo, countryRole = false) {
        const divisionRoles = await this.client.platron_utils.getRolesWithGroup('division');

        if (!citizen.citizen.verified) {
            winston.verbose('User not verified. Removing all division roles');
            return {
                remove: divisionRoles
            };
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            return {
                remove: divisionRoles
            };
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(divisionrole)');
        }

        const role = await this.client.platron_utils.findOrCreateRole(`div${citizenInfo.military.militaryData.divisionData.division}`, 'division', guild, {
            name: `DIV ${citizenInfo.military.militaryData.divisionData.division}`,
            color: '#0faf8d'
        });

        const otherDivisions = divisionRoles.filter(key => {
            return key != role.id;
        });

        return {
            remove: otherDivisions,
            add: [role]
        };
    }

    async _addPartyRole(guild, citizen, citizenInfo, countryRole = false) {
        const roleKeys = await this.client.platron_utils.getRolesWithGroup('party');

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);

            return {
                remove: roleKeys
            };
        }

        if (citizenInfo.partyData && citizen.citizen.verified) {
            const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.partyData.name).toLowerCase(), 'party', guild, {
                name: citizenInfo.partyData.name,
                color: '#923dff'
            });

            // Get all parties that the member does not belong to
            const otherParties = roleKeys.filter(key => {
                return key != role.id;
            });

            return {
                remove: otherParties,
                add: [role]
            };
        } else {
            return {
                remove: roleKeys
            };
        }
    }

    async _addMURole(guild, citizen, citizenInfo, countryRole) {
        const muRoles = await this.client.platron_utils.getRolesWithGroup('mu');

        if (!citizen.citizen.verified) {
            return {
                remove: muRoles
            };
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            return {
                remove: muRoles
            };
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(mu)');
        }

        if (!citizenInfo.military.militaryUnit.name) {
            return {
                remove: muRoles
            }
        }

        const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.military.militaryUnit.name).toLowerCase(), 'mu', guild, {
            name: citizenInfo.military.militaryUnit.name,
            color: '#212121'
        });

        const otherMUs = muRoles.filter(key => {
            return key != role.id;
        });

        return {
            remove: otherMUs,
            add: [role]
        };
    }

    async _addCountryRole(guild, citizen, citizenInfo) {
        const countryRoles = await this.client.platron_utils.getRolesWithGroup('country');

        if (!citizen.citizen.verified) {
            winston.verbose(citizen.citizen.id, 'Not verified');

            return {
                remove: countryRoles
            };
        }

        if (!citizenInfo) {
            return winston.warn('No citizenInfo for', citizen.member.user.username, '(countryrole)');
        }

        const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.location.citizenshipCountry.name).toLowerCase(), 'country', guild, {
            name: citizenInfo.location.citizenshipCountry.name,
            color: '#af900f'
        });

        const otherCountries = countryRoles.filter(key => {
            return key != role.id;
        });

        await citizen.member.addRole(role);

        return {
            remove: otherCountries,
            add: []
        };
    }
};

module.exports = APIRoleSetter;