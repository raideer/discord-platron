const CronModule = require('../CronModule');
const slugify = require('slugify');
const utils = require('../utils');
const winston = require('winston');
const Promise = require('bluebird');

module.exports = class RoleSetter extends CronModule {
    constructor() {
        super('partyRoleSetter', {
            tab: () => {
                return this.client.env('PARTY_ROLE_SETTER', '0 * * * *');
            }
        });
    }

    async _addCongressRole(citizen, guild, citizenInfo) {
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
        const role = await this.utils.findOrCreateRole('congress', 'congress', guild, {
            name: 'Congress',
            color: '#0f81c9'
        });

        const inCongress = titles.indexOf(citizenInfo.partyRole) !== -1;

        console.log(citizen.citizen.id, citizen.member.user.username, citizen.citizen.verified);
        console.log('In congress', inCongress);

        if (!inCongress || !citizen.citizen.verified) {
            await citizen.member.removeRole(role);

            return;
        }

        await citizen.member.addRole(role);
        winston.verbose('Added congress role to', citizen.member.user.username);
    }

    async _addPartyRole(citizen, guild, citizenInfo) {
        const roleKeys = await this.utils.getRolesWithGroup('party');
        if (citizenInfo.party && citizen.citizen.verified) {
            const role = await this.utils.findOrCreateRole(slugify(citizenInfo.party).toLowerCase(), 'party', guild, {
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
            citizens = await this.utils.getCitizensInGuild(guild);
        }

        const partyRoleEnabled = await this.client.guildConfig(guild, 'setPartyRoles', false);
        const congressRoleEnabled = await this.client.guildConfig(guild, 'setCongressRoles', false);

        // Temporary citizen info caching
        const citizenData = {};
        const getCitizenInfo = async id => {
            if (citizenData[id]) {
                return citizenData[id];
            }

            citizenData[id] = await utils.getCitizenInfo(id);
            // Spacing out requests
            await new Promise(resolve => setTimeout(resolve, 2000));
            return citizenData[id];
        };

        if (partyRoleEnabled == '1') {
            winston.info('Adding party roles');
            await Promise.each(citizens.array(), async citizen => {
                const citizenInfo = await getCitizenInfo(citizen.citizen.id);
                await this._addPartyRole(citizen, guild, citizenInfo);
            });
        }

        if (congressRoleEnabled == '1') {
            winston.info('Adding congress roles');
            await Promise.each(citizens.array(), async citizen => {
                const citizenInfo = await getCitizenInfo(citizen.citizen.id);
                await this._addCongressRole(citizen, guild, citizenInfo);
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
