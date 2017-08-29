const CronModule = require('../CronModule');
const async = require('async');
const slugify = require('slugify');
const utils = require('../utils');
const winston = require('winston');
const colors = require('colors');

module.exports = class RoleSetter extends CronModule {
    constructor() {
        super('partyRoleSetter', {
            tab: () => {
                return this.client.env('PARTY_ROLE_SETTER', '0 * * * *');
            }
        });
    }

    _findOrCreateRole(roleType, roleKey, guild, defaults) {
        return new Promise((resolve, reject) => {
            const Role = this.client.databases.roles.table;

            Role.findOne({
                where: {
                    type: roleType,
                    guildId: guild.id,
                    key: roleKey
                }
            }).then(item => {
                if (item) {
                    winston.verbose('Found role in db with type', roleType);
                    const role = guild.roles.find('id', item.id);

                    if (role) {
                        winston.verbose('Found role in the collection');
                        return resolve(role);
                    }
                }

                return guild.createRole(defaults).then(createdRole => {
                    winston.info('Created role', createdRole.name, 'with id', createdRole.id);

                    Role.create({
                        id: createdRole.id,
                        type: roleType,
                        guildId: guild.id,
                        key: roleKey
                    }).then(() => {
                        winston.info('Role', createdRole.id, 'saved to database for guild', guild.id);
                        resolve(createdRole);
                    });
                });
            });
        });
    }

    _getRolesWithKey(key) {
        return new Promise((resolve, reject) => {
            const Role = this.client.databases.roles.table;

            Role.findAll({
                where: {
                    key: key
                }
            }).then(roles => {
                let keys = [];

                for(let i in roles) {
                    keys.push(roles[i].id);
                }

                resolve(keys);
            });
        });
    }

    _addOrRemoveCongressRole(member, guild, remove = false) {
        return new Promise((resolve, reject) => {
            this._findOrCreateRole('congress', 'congress', guild, {
                name: 'Congress',
                color: '#0f81c9'
            }).then(role => {
                if (remove) {
                    if (member.roles.has(role.id)) {
                        return member.removeRole(role).then(resolve);
                    }

                    return resolve();
                }

                if (!member.roles.has(role.id)) {
                    return member.addRole(role).then(resolve);
                }

                winston.verbose('Member', member.user.username ,'already has congress role');

                return resolve();
            });
        });
    }

    _addPartyRole(party, member, guild) {
        return new Promise((resolve, reject) => {
            this._getRolesWithKey('party').then(roleKeys => {
                if (party) {
                    return this._findOrCreateRole(slugify(party).toLowerCase(), 'party', guild, {
                        name: party,
                        color: '#923dff'
                    }).then(role => {
                        const otherParties = roleKeys.filter((key) => {
                            return key != role.id;
                        });

                        // Remove other party roles
                        member.removeRoles(otherParties).then(() => {
                            if (!member.roles.has(role.id)) {
                                member.addRole(role);
                                winston.verbose('Attached role', role.name, 'to', member.user.username)
                            } else {
                                winston.verbose(member.user.username, 'already has role', role.name);
                            }

                            resolve();
                        });
                    });
                } else {
                    // Remove all party roles if not in a party
                    member.removeRoles(roleKeys).then(resolve);
                }
            });
        });
    }

    _removeAllRoles(member, guild) {
        return new Promise((resolve, reject) => {
            const Role = this.client.databases.roles.table;

            Role.findAll({
                where: {
                    guildId: guild.id
                }
            }).then(roles => {
                let roleKeys = [];
                for(let i in roles) {
                    roleKeys.push(roles[i].id);

                }

                member.removeRoles(roleKeys).then(resolve).catch(resolve);
            });
        });
    }

    _processGuild(guild) {
        return new Promise((resolve, reject) => {
            const Citizen = this.client.databases.citizens.table;
            async.eachSeries(guild.members.array(), (member, cb) => {
                winston.verbose('Checking roles for user', member.user.username, member.user.id)

                Citizen.findOne({where: {
                    discord_id: member.user.id
                }}).then(dbUser => {
                    if (!dbUser) {
                        winston.verbose('User', member.user.username, member.user.id, 'not registered');
                        return this._removeAllRoles(member, guild).then(() => {
                            winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
                            cb();
                        });
                    }

                    if (!dbUser.verified) {
                        winston.verbose('User', dbUser.id, 'is not verified');
                        return this._removeAllRoles(member, guild).then(() => {
                            winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
                            cb();
                        });
                    }

                    utils.getCitizenInfo(dbUser.id).then(data => {
                        this._addPartyRole(data.party, member, guild).then(() => {
                            const inCongress =  data.partyRole == 'Congress Member';

                            if (inCongress) {
                                winston.verbose('User', member.user.username, member.user.id, 'is in congress');
                            } else {
                                winston.verbose('User', member.user.username, member.user.id, 'is NOT in congress');
                            }

                            this._addOrRemoveCongressRole(member, guild, !inCongress).then(() => {
                                setTimeout(cb, 2000);
                            });
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
            winston.info('Setting party roles for guild', guild.name.cyan);
            let timer = winston.startTimer();
            this._processGuild(guild).then(() => {
                timer.done(`Finished setting party roles for guild ${guild.name.cyan}`);
                cb();
            });
        });
    }
}
