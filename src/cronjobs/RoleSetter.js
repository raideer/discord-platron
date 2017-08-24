const CronModule = require('../CronModule');

module.exports = class RoleSetter extends CronModule {
    constructor() {
        super('roleSetter', {
            tab: '*/2 * * * *'
        });
    }

    getDbGuild(id) {
        return new Promise((resolve, reject) => {
            const Guild = this.client.databases.guilds.table;

            Guild.findById(id).then(guild => {
                if (guild) {
                    return resolve(guild);
                }

                return resolve(null);
            })
        });
    }

    /**
     * [findOrCreateRole description]
     * @param  {Guild} guild    Subject Guild
     * @param  {String} roleKey  Role key
     * @param  {RoleData} defaults
     * @return {Role}
     */
    findOrCreateRole(guild, roleKey, defaults) {
        return new Promise((resolve, reject) => {
            this.getDbGuild(guild.id).then(item => {
                if (!item.roles) {
                    item.roles = {};
                }

                const roleId = item.roles[roleKey];

                let role = null;

                if (roleId) {
                    role = guild.roles.find('id', roleId);
                }

                if (!role) {
                    console.log('Creating role', defaults.name, 'in guild', guild.name);
                    return guild.createRole(defaults).then(createdRole => {
                        item.roles[roleKey] = createdRole.id;
                        return item.save().then(() => {
                            return resolve(createdRole);
                        });
                    }).catch(error => {
                        if (error.code == 50013) {
                            return reject(`Missing role permissions in guild ${guild.name}`);
                        }

                        return reject(error);
                    });
                }

                return resolve(role);
            });
        });
    }

    exec() {
        this.client.guilds.forEach((guild) => {
            guild.members.forEach((member) => {
                this.client.roleHandler.modules.forEach((module) => {
                    const checkIfEnabled = Promise.resolve(module.isEnabled(guild));
                    checkIfEnabled.then(enabled => {
                        if (!enabled) {
                            return console.log('Role', module.roleKey, 'not enabled in guild', guild.name);
                        }

                        const check = Promise.resolve(module.isEligible(member, guild));
                        check.then(isEligible => {

                            this.findOrCreateRole(guild, module.roleKey, module.roleOptions).then(role => {
                                if (!!isEligible) {
                                    if (!member.roles.has(role.id)) {
                                        member.addRole(role).then(() => {
                                            // console.log('Added role', module.roleKey, 'to', member.user.username);
                                        });
                                    } else {
                                        // console.log('Member', member.user.username, 'already has role', module.roleKey);
                                    }
                                }else {
                                    if (member.roles.has(role.id)) {
                                        member.removeRole(role).then(() => {
                                            // console.log('Removed role', module.roleKey, 'from', member.user.username);
                                        });
                                    } else {
                                        // console.log('Member', member.user.username, 'is NOT eligible for', module.roleKey);
                                    }
                                }
                            });

                        });

                    });
                });
            });
        });
    }
}
