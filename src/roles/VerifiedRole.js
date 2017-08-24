const AutoRoleModule = require('../AutoRoleModule');

module.exports = class VerifiedRole extends AutoRoleModule {
    constructor() {
        super('verified', {
            roleKey: 'roleVerified',
            roleOptions: {
                name: 'Verified by PlaTRON',
                color: '#5e9e11'
            }
        });
    }

    isEnabled(guild) {
        return new Promise((resolve, reject) => {
            const db = this.client.databases.guilds.table;

            db.findById(guild.id).then(guild => {

                if (guild) {
                    if (guild.roleVerifiedEnabled) {
                        return resolve(true);
                    }
                }

                return resolve(false);
            });
        });
    }

    isEligible(member, guild) {
        return new Promise((resolve, reject) => {
            const db = this.client.databases.citizens.table;

            db.findOne({
                where: {
                    discord_id: member.user.id
                }
            }).then(user => {
                if (!user) {
                    return resolve(false);
                }

                if (user.verified) {
                    return resolve(true);
                }

                return resolve(false);
            });
        });
    }
}
