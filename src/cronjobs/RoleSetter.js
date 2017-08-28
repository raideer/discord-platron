const CronModule = require('../CronModule');
const async = require('async');

module.exports = class RoleSetter extends CronModule {
    constructor() {
        super('roleSetter', {
            tab: () => {
                return this.client.env('ROLE_SETTER', '*/5 * * * *');
            }
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

                const roleId = item[roleKey];

                let role = null;

                if (roleId) {
                    role = guild.roles.find('id', roleId);
                    // console.log('found role', role.name);
                }

                if (!role) {
                    console.log('Creating role', defaults.name, 'in guild', guild.name);
                    return guild.createRole(defaults).then(createdRole => {
                        console.log('Role created', createdRole.id);
                        item[roleKey] = createdRole.id;
                        return item.save().then((updatedItem) => {
                            console.log('database item updated', updatedItem.roles);
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
            }).catch(reject);
        });
    }

    _checkIfEligible(module, guild, member) {
        return new Promise((resolve, reject) => {
            const check = Promise.resolve(module.isEligible(member, guild, this.preData));
            check.then(isEligible => {
                return resolve(isEligible);
            });
        });
    }

    _checkIfEnabled(module, guild) {
        return new Promise((resolve, reject) => {
            const checkIfEnabled = Promise.resolve(module.isEnabled(guild));
            checkIfEnabled.then(enabled => {
                if (!enabled) {
                    console.log('Role', module.roleKey, 'not enabled in guild', guild.name);
                }

                return resolve(enabled);
            });
        });
    }

    _applyRole(module, guild, member, isEligible) {
        return new Promise((resolve, reject) => {
            this.findOrCreateRole(guild, module.roleKey, module.roleOptions).then(role => {
                if (!!isEligible) {
                    if (!member.roles.has(role.id)) {
                        return member.addRole(role).then(() => {
                            resolve();
                            console.log('Added role', module.roleKey, 'to', member.user.username);
                        });
                    } else {
                        return resolve();
                    }
                }else {
                    if (member.roles.has(role.id)) {
                        return member.removeRole(role).then(() => {
                            resolve();
                            console.log('Removed role', module.roleKey, 'from', member.user.username);
                        });
                    } else {
                        return resolve();
                    }
                }
            });
        });
    }

    _processGuild(guild) {
        return new Promise((resolve, reject) => {
            async.eachSeries(guild.members.array(), (member, callback) => {
                console.log('Looking at', member.user.username);

                this.client.roleHandler.modules.forEach((module) => {
                    this._checkIfEnabled(module, guild).then((isEnabled) => {

                        if (!isEnabled) {
                            return callback();
                        }

                        this._checkIfEligible(module, guild, member).then((isEligible) => {

                            this._applyRole(module, guild, member, isEligible).then(callback);

                        });
                    });
                });

            }, () => {
                resolve();
            });
        });
    }

    exec() {
        async.eachSeries(this.client.guilds.array(), (guild, cb) => {
            console.log('processing', guild.name);
            this._processGuild(guild).then(() => {
                console.log('\n\n\n');
                cb();
            })
        });
    }
}
