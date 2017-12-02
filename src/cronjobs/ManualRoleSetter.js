const CronModule = require('../CronModule');
const slugify = require('slugify');
const winston = require('winston');
const Promise = require('bluebird');

module.exports = class ManualRoleSetter extends CronModule {
    constructor() {
        super('manualRoleSetter', {
            tab: () => {
                return this.client.env('MANUAL_ROLE_SETTER', '0 * * * *');
            }
        });
    }

    async _addCongressRole(citizen, guild, citizenInfo, countryRole = false) {
        const titles = [
            'Congress Member',
            'Prime Minister',
            'Governor',
            'Minister of Defense',
            'Minister of Foreign Affairs',
            'Minister of Education',
            'Country President'
        ];

        // Get or create the congress role
        const role = await this.client.platron_utils.findOrCreateRole('congress', 'congress', guild, {
            name: 'Congress',
            color: '#0f81c9'
        });

        const inCongress = titles.indexOf(citizenInfo.partyRole) !== -1;

        winston.verbose(citizen.member.user.username, 'in congress', inCongress, citizenInfo.partyRole);

        if (!inCongress || !citizen.citizen.verified) {
            await citizen.member.removeRole(role);
            return;
        }

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            await citizen.member.removeRole(role);
            return;
        }

        await citizen.member.addRole(role);
        winston.verbose('Added congress role to', citizen.member.user.username);
    }

    async _addPartyRole(citizen, guild, citizenInfo, countryRole = false) {
        const roleKeys = await this.client.platron_utils.getRolesWithGroup('party');

        if (countryRole && !citizen.member.roles.has(countryRole)) {
            winston.verbose(`Citizen ${citizen.member.user.username} does not have countryrole ${countryRole}`);
            await citizen.member.removeRoles(roleKeys);
            return;
        }

        if (citizenInfo.party && citizen.citizen.verified) {
            const role = await this.client.platron_utils.findOrCreateRole(slugify(citizenInfo.party).toLowerCase(), 'party', guild, {
                name: citizenInfo.party,
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

    async _processGuild(guild, citizens) {
        if (!citizens) {
            citizens = await this.client.platron_utils.getCitizensInGuild(guild);
        }

        const partyRoleEnabled = await this.client.guildConfig(guild, 'setPartyRoles', false);
        const congressRoleEnabled = await this.client.guildConfig(guild, 'setCongressRoles', false);
        let countryRole = await this.client.guildConfig(guild, 'countryRole', false);

        if (countryRole == '0') {
            countryRole = false;
        }

        // Temporary citizen info caching
        const citizenData = {};
        const getCitizenInfo = async id => {
            if (citizenData[id]) {
                return citizenData[id];
            }

            citizenData[id] = await this.client.platron_utils.getCitizenInfo(id);
            // Spacing out requests
            await new Promise(resolve => setTimeout(resolve, 200));
            return citizenData[id];
        };

        if (partyRoleEnabled == '1') {
            winston.info('Adding party roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    const citizenInfo = await getCitizenInfo(citizen.citizen.id);
                    await this._addPartyRole(citizen, guild, citizenInfo, countryRole);
                } catch (e) {
                    winston.error(e);
                }
            });
        }

        if (congressRoleEnabled == '1') {
            winston.info('Adding congress roles');
            await Promise.each(citizens.array(), async citizen => {
                try {
                    const citizenInfo = await getCitizenInfo(citizen.citizen.id);
                    await this._addCongressRole(citizen, guild, citizenInfo, countryRole);
                } catch (e) {
                    winston.error(e);
                }
            });
        }
    }

    async exec() {
        await Promise.each(this.client.guilds.array(), async guild => {
            winston.info('Setting party roles for guild', guild.name);
            const timer = winston.startTimer();
            await this._processGuild(guild);
            timer.done(`Finished setting party roles for guild ${guild.name}`);
        });
    }
};
