const winston = require('winston');
const { Collection } = require('discord.js');

module.exports = class CronUtils {
    constructor(module) {
        this.module = module;
    }

    get client() {
        return this.module.client;
    }

    async getCitizensInGuild(guild) {
        const Citizen = this.client.databases.citizens.table;
        const citizens = await Citizen.all();
        const filtered = new Collection();

        for (const i in citizens) {
            const citizen = citizens[i];

            if (guild.members.has(citizen.discord_id)) {
                filtered.set(citizen.id, {
                    citizen: citizen,
                    member: guild.members.get(citizen.discord_id)
                });
            }
        }

        return filtered;
    }

    async removeAllRoles(member, guild) {
        const Role = this.client.databases.roles.table;
        const roles = await Role.findAll({
            where: {
                guildId: guild.id
            }
        });

        const roleKeys = [];
        for (const i in roles) {
            roleKeys.push(roles[i].id);
        }

        await member.removeRoles(roleKeys);
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
            group: roleGroup,
            mentionable: true
        });
        winston.info('Role', createdRole.id, 'saved to database for guild', guild.id);
        return createdRole;
    }
};
