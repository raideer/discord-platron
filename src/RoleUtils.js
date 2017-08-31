const winston = require('winston');

module.exports = class RoleUtils {
    constructor(module) {
        this.module = module;
    }

    get client() {
        return this.module.client;
    }

    removeAllRoles(member, guild){
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

    getRolesWithKey(key) {
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

    findOrCreateRole(roleType, roleKey, guild, defaults) {
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
                    } else {
                        winston.warn('Role', item.id, 'was not valid. Deleting from database');
                        item.destroy();
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
}
