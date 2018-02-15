const CronModule = require('../CronModule');
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

    async addCongressRoles(guild) {
        const congressRoleEnabled = await this.client.guildConfig(guild, 'setCongressRoles', false, true);

        if (congressRoleEnabled) {
            const congressCountry = await this.client.guildConfig(guild, 'congressCountry', false);
            if (!congressCountry) {
                return winston.error(`Congress country not set in guild ${guild.name}`);
            }

            const data = await this.client.api(`congress/${congressCountry}/members`);
            const members = data.map(member => member.id);

            const role = await this.client.platron_utils.findOrCreateRole('congress', 'congress', guild, {
                name: 'Congress',
                color: '#0f81c9'
            });

            const guildCitizens = await this.client.platron_utils.getCitizensInGuild(guild);
            guildCitizens.forEach(async citizenMember => {
                if (members.includes(citizenMember.citizen.id)) {
                    await citizenMember.member.addRole(role);
                } else {
                    await citizenMember.member.removeRole(role);
                }
            });
        } else {
            winston.info('Congress roles are disabled in', guild.name);
        }
    }

    async _processGuild(guild) {
        await this.addCongressRoles(guild);
    }

    async exec() {
        await Promise.each(this.client.guilds.array(), async guild => {
            await this._processGuild(guild);
        });
    }
};
