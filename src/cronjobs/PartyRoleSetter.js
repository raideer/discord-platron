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

    _addOrRemoveCongressRole(member, guild, remove = false) {
        return new Promise((resolve, reject) => {
            this.roleUtils.findOrCreateRole('congress', 'congress', guild, {
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
            this.roleUtils.getRolesWithKey('party').then(roleKeys => {
                if (party) {
                    return this.roleUtils.findOrCreateRole(slugify(party).toLowerCase(), 'party', guild, {
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

    _processMember(member, guild) {
        return new Promise((resolve, reject) => {
            winston.verbose('Checking roles for user', member.user.username, member.user.id)
            const Citizen = this.client.databases.citizens.table;
            Citizen.findOne({where: {
                discord_id: member.user.id
            }}).then(dbUser => {
                if (!dbUser) {
                    winston.verbose('User', member.user.username, member.user.id, 'not registered');
                    return this.roleUtils.removeAllRoles(member, guild).then(() => {
                        winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
                        resolve();
                    });
                }

                if (!dbUser.verified) {
                    winston.verbose('User', dbUser.id, 'is not verified');
                    return this.roleUtils.removeAllRoles(member, guild).then(() => {
                        winston.verbose('Removed ineligible roles for', member.user.username, member.user.id);
                        resolve();
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
                            setTimeout(resolve, 2000);
                        });
                    });
                });
            });
        });
    }

    _processGuild(guild) {
        return new Promise((resolve, reject) => {
            async.eachSeries(guild.members.array(), (member, cb) => {
                this._processMember(member, guild).then(cb);
            }, resolve);
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
