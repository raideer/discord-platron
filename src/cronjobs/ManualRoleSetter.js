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
        const congressRoleEnabled = await this.client.settings.get(guild, 'setCongressRoles', false);

        if (congressRoleEnabled) {
            const congressCountry = await this.client.settings.get(guild, 'congressCountry', false);
            if (!congressCountry) {
                return winston.error(`Congress country not set in guild ${guild.name}`);
            }

            const value = this.client.settings.get(guild, 'congressList', null);

            if (!value) {
                return;
            }

            const members = value.split(',');

            // let members;
            // try {
            //     members = await this.client.platron_utils.privateApi(`congress/${congressCountry}/members`);
            // } catch (e) {
            //     return winston.error('There was an error calling the api');
            // }

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
        const timerOverall = winston.startTimer();
        winston.verbose('Starting to set MANUAL roles');

        await Promise.each(this.client.guilds.array(), async guild => {
            const timer = winston.startTimer();
            await this._processGuild(guild);
            timer.done(`Finished setting MANUAL roles for guild ${guild.name}`);
        });

        timerOverall.done('Finished setting MANUAL roles');
    }
};
