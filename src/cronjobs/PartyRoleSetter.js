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

    async _addOrRemoveCongressRole(member, guild, remove = false) {
        // Get or create the congress role
        const role = await this.roleUtils.findOrCreateRole('congress', 'congress', guild, {
            name: 'Congress',
            color: '#0f81c9'
        });

        if (remove) {
            await member.removeRole(role);

            return;
        }

        if (!member.roles.has(role.id)) {
            await member.addRole(role);

            return;
        }

        winston.verbose('Member', member.user.username, 'already has congress role');
    }

    async _addPartyRole(party, member, guild) {
        const roleKeys = this.roleUtils.getRolesWithKey('party');
        if (party) {
            const role = await this.roleUtils.findOrCreateRole(slugify(party).toLowerCase(), 'party', guild, {
                name: party,
                color: '#923dff'
            });

            // Get all parties that the member does not belong to
            const otherParties = roleKeys.filter(key => {
                return key != role.id;
            });

            await member.removeRoles(otherParties);
            await member.addRole(role);
        } else {
            // If not a member of any party, remove all party roles
            await member.removeRoles(roleKeys);
        }
    }

    async _processMember(member, guild) {
        winston.verbose('Checking roles for user', member.user.username, member.user.id);
        const Citizen = this.client.databases.citizens.table;
        const dbUser = await Citizen.findOne({
            where: {
                discord_id: member.user.id
            }
        });

        if (!dbUser) {
            winston.verbose('User', member.user.username, member.user.id, 'not registered');
            await this.roleUtils.removeAllRoles(member, guild);
            winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
            return;
        }

        if (!dbUser.verified) {
            winston.verbose('User', dbUser.id, 'is not verified');
            await this.roleUtils.removeAllRoles(member, guild);
            winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
            return;
        }

        const citizenInfo = await utils.getCitizenInfo(dbUser.id);
        await this._addPartyRole(citizenInfo.party, member, guild);
        const titles = [
            'Congress Member',
            'Prime Minister',
            'Governor',
            'Minister of Defense',
            'Minister of Foreign Affairs',
            'Minister of Education'
        ];

        const inCongress = titles.indexOf(citizenInfo.partyRole) !== -1;

        if (inCongress) {
            winston.verbose('User', member.user.username, member.user.id, 'is in congress');
        } else {
            winston.verbose('User', member.user.username, member.user.id, 'is NOT in congress');
        }

        await this._addOrRemoveCongressRole(member, guild, !inCongress);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async _processGuild(guild) {
        await Promise.each(guild.members.array(), async member => {
            await this._processMember(member, guild);
        });
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
