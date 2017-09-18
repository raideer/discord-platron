const winston = require('winston');

module.exports = class RoleUtils {
    constructor(module) {
        this.module = module;
    }

    get client() {
        return this.module.client;
    }

    removeAllRoles(member, guild) {
        return new Promise(resolve => {
            const Role = this.client.databases.roles.table;

            Role.findAll({
                where: {
                    guildId: guild.id
                }
            }).then(roles => {
                const roleKeys = [];
                for (const i in roles) {
                    roleKeys.push(roles[i].id);
                }

                member.removeRoles(roleKeys).then(resolve).catch(resolve);
            });
        });
    }

    async getRolesWithGroup(group) {
        const Role = this.client.databases.roles.table;
        const roles = await Role.findAll({
            where: {
                group: group
            }
        });

        return roles.map(role => {
            return role.id;
        });
    }

    async findOrCreateRole(roleName, roleGroup, guild, defaults) {
        const Role = this.client.databases.roles.table;
        const roleItem = await Role.findOne({
            where: {
                name: roleName,
                guildId: guild.id,
                group: roleGroup
            }
        });

        if (roleItem) {
            winston.verbose('Found role in db with name', roleName);

            if (guild.roles.has(roleItem.id)) {
                winston.verbose('Found role in the collection');
                return guild.roles.get(roleItem.id);
            } else {
                winston.warn('Role', roleItem.id, 'was not valid. Deleting from database');
                await roleItem.destroy();
            }
        }

        const createdRole = await guild.createRole(defaults);
        winston.info('Created role', createdRole.name, 'with id', createdRole.id);

        await Role.create({
            id: createdRole.id,
            name: roleName,
            guildId: guild.id,
            group: roleGroup
        });
        winston.info('Role', createdRole.id, 'saved to database for guild', guild.id);
        return createdRole;
    }
};
