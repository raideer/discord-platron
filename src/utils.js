const countries_json = require('./countryCodes.json');
const { Collection } = require('discord.js');
const { ClientUtil } = require('discord-akairo');
const cheerio = require('cheerio');
const request = require('request-promise');
const winston = require('winston');

module.exports = class Utils extends ClientUtil {
    get countries() {
        const col = new Collection();

        for (const c in countries_json) {
            col.set(c, countries_json[c]);
        }

        return col;
    }

    objectToCollection(object) {
        const col = new Collection();
        for (const id in object) {
            col.set(id, object[id]);
        }
        return col;
    }

    getFlag(countryName) {
        const country = this.countries.find(c => {
            return c.countryName.toLowerCase() == countryName.toLowerCase();
        });

        if (country) {
            return `:flag_${country.iso2.toLowerCase()}:`;
        }

        return '';
    }

    number(number) {
        return Number(number).toLocaleString();
    }

    async resolveCitizen(name, discord_id, guild) {
        const member = this.client.util.resolveMember(name, guild.members);
        if (member) {
            const Citizen = this.client.databases.citizens.table;
            const citizen = await Citizen.findOne({
                where: {
                    discord_id: member.user.id
                }
            });

            return citizen;
        }

        return null;
    }

    async addRoles(member, citizen, guild) {
        const roleSetter = this.client.cronHandler.modules.get('manualRoleSetter');
        const apiroleSetter = this.client.cronHandler.modules.get('apiRoleSetter');

        const fakeColl = new Collection();
        fakeColl.set(citizen.id, {
            citizen: citizen,
            member: member
        });

        winston.info('Running apiRoleSetter module');
        await apiroleSetter._processGuild(guild, fakeColl);
        winston.info('Running manualRoleSetter module');
        await roleSetter._processGuild(guild, fakeColl);
    }

    async resolveCitizenId(input, discord_id, guild = null) {
        const Citizen = this.client.databases.citizens.table;
        if (!input) {
            const citizen = await Citizen.findOne({
                where: {
                    discord_id: discord_id
                }
            });

            if (citizen) {
                return citizen.id;
            }
            return null;
        }

        if (Number.isInteger(Number(input))) {
            return input;
        }

        if (guild) {
            const citizen = await this.resolveCitizen(input, discord_id, guild);
            if (citizen) {
                return citizen.id;
            }
        }

        const id = await this.citizenNameToId(input);
        if (id) {
            return id;
        }

        return null;
    }

    strToColor(str) {
        const hashCode = s => {
            let hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = s.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        };

        const intToRGB = i => {
            var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
            return '00000'.substring(0, 6 - c.length) + c;
        };

        if (!str || str == '') {
            return 'ffffff';
        }

        return intToRGB(hashCode(str)).toLowerCase().split('')
        .reduce((result, ch) => (result * 16) + '0123456789abcdefgh'.indexOf(ch), 0);
    }

    async citizenNameToId(name) {
        const body = await request.get(`https://www.erepublik.com/en/main/search/?q=${encodeURIComponent(name)}`);
        const $ = cheerio.load(body);

        const results = $('table.bestof tr');

        if (results.length >= 2) {
            const profileUrl = $(results[1]).find('.nameholder a').attr('href');
            if (profileUrl) {
                const match = profileUrl.match(/profile\/([0-9]+)/);
                if (match) {
                    const id = Number(match[1]);

                    return id;
                }
            }
        }
    }

    get client() {
        return this.module.client;
    }

    invalidCommand(message, command) {
        return this.client.emit('invalidUsage', message, command);
    }

    async deutchlandApi(query) {
        const apiKey = this.client.env('EREP_API', () => {
            throw 'eRepublik Deutchland API key is not set!';
        });

        const body = await request({
            uri: `https://api.erepublik-deutschland.de/${apiKey}/${query}`,
            json: true,
            timeout: 3000
        });

        return body;
    }

    async privateApi(query) {
        const apiIP = this.client.env('API_IP', () => {
            throw 'API IP NOT SET!';
        });

        const apiPORT = this.client.env('API_PORT', 80);
        const apiSUFFIX = this.client.env('API_SUFFIX', '/');

        const body = await request({
            uri: `http://${apiIP}:${apiPORT}${apiSUFFIX}${query}.json`,
            json: true,
            timeout: 3000
        });

        return body;
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
            if (guild.roles.has(roleItem.id)) {
                return guild.roles.get(roleItem.id);
            } else {
                winston.warn('Role', roleItem.id, 'was not valid. Deleting from database');
                await roleItem.destroy();
            }
        }

        const createdRole = await guild.createRole(defaults);
        
        await Role.create({
            id: createdRole.id,
            name: roleName,
            guildId: guild.id,
            group: roleGroup,
            mentionable: true
        });
        
        winston.info('Created role', createdRole.name, 'with id', createdRole.id);
        return createdRole;
    }
};
