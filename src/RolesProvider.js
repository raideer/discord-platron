const { SequelizeProvider } = require('discord-akairo');
const winston = require('winston');
require('colors');

module.exports = class RolesProvider extends SequelizeProvider {
    async set(guild, role, value, group) {
        if (this.has(guild, role)) {
            await this.clear(guild, role);
        }

        await this.table.create({
            id: value,
            name: role,
            group,
            guildId: guild.id
        });

        winston.info(`[${String(guild.id).cyan}] Role ${role} was set to ${value}`);
    }

    async clear(guild, role) {
        const roleObject = this.get(guild, role);
        if (roleObject) {
            await super.clear(roleObject.id);
        }
    }

    has(guild, role) {
        return !!this.get(guild, role, false);
    }

    get(guild, role) {
        const value = this.items.find(field => {
            if (field.name == role && field.guildId == guild.id) {
                return true;
            }

            return false;
        });

        if (value) {
            return guild.roles.find('id', value.id);
        }

        return null;
    }

    getGroup(guild, group) {
        return this.items.findAll('group', group);
    }

    getAll(guild, roles) {
        const values = [];
        
        roles.forEach(role => {
            const needle = this.get(guild, role);
            if (needle) {
                values.push(needle);
            }
        });

        return values;
    }
};
