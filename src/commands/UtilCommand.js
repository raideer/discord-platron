const Command = require('../PlatronCommand');
const winston = require('winston');

class UtilCommand extends Command {
    constructor() {
        super('util', {
            aliases: ['set', 'get', 'run'],
            args: [
                {
                    id: 'command',
                    type: 'string'
                },
                {
                    id: 'arg',
                    type: 'string',
                    match: 'rest'
                }
            ],
            channelRestriction: 'guild',
            allowWhenDisabled: true,
            showInHelp: false
        });
    }

    userPermissions(message) {
        const isOwner = Array.isArray(this.client.ownerID)
                ? this.client.ownerID.includes(message.author.id)
                : message.author.id === this.client.ownerID;

        return message.channel.permissionsFor(message.author).has('ADMINISTRATOR')
        || isOwner;
    }

    async runSet(message, args) {
        switch (args.command) {
        case 'registered': {
            // !set registered Industrials|myid
            const [username, citizen_id] = args.arg.split('|');
            const member = this.client.util.resolveMember(username, message.guild.members);
            if (member) {
                const Citizen = this.client.databases.citizens.table;
                await Citizen.findOrCreate({
                    where: {
                        discord_id: member.user.id
                    },
                    defaults: {
                        id: citizen_id,
                        discord_id: member.user.id,
                        verified: 1
                    }
                }).spread(async (citizen, created) => {
                    if (created) {
                        citizen.verified = true;
                        await citizen.save();
                    }

                    if (citizen.id != citizen_id) {
                        citizen.id = citizen_id;
                        await citizen.save();
                    }

                    await this.client.platron_utils.addRoles(member, citizen, message.guild);
                    await message.reply(`${member.user.username} registered as ${citizen.id}`);
                });
            }
            break;
        }
        default:
            return message.reply(this.client._('bot.invalid_request'));
        }
    }

    runGet(message, args) {
        switch (args.command) {
        case 'invite':
            return message.reply(`<https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=268435464>`);
        case 'roleId': {
            const roleResolvable = args.arg;
            const role = this.client.util.resolveRole(roleResolvable, message.guild.roles);
            if (role) {
                return message.reply(`ID **${roleResolvable}**: \`${role.id}\``);
            } else {
                return message.reply(`Role **${roleResolvable}** not found`);
            }
        }
        }
    }

    async runRun(message, args) {
        switch (args.command) {
        case 'purgeCitizen': {
            const citizen = await this.client.platron_utils.resolveCitizen(args.arg, message.author.id, message.guild);
            if (citizen) {
                await citizen.destroy();
                await message.reply('Citizen purged');
                return;
            }

            await message.reply('Citizen not found');
            break;
        }
        case 'updateRoles': {
            if (this.client.cronHandler && message.guild) {
                const roleSetter = this.client.cronHandler.modules.get('manualRoleSetter');
                const apiRoleSetter = this.client.cronHandler.modules.get('apiRoleSetter');

                if (apiRoleSetter && (args.arg == 'api' || !args.arg)) {
                    winston.info('Running apiRoleSetter module');
                    await apiRoleSetter._processGuild(message.guild);
                    await message.reply('Finished setting api roles');
                } else {
                    winston.error('API role setter not found');
                }

                if (roleSetter && (args.arg == 'manual' || !args.arg)) {
                    winston.info('Running manualRoleSetter module');
                    await roleSetter._processGuild(message.guild);
                    await message.reply('Finished setting manual roles');
                } else {
                    winston.error('Manual role setter not found');
                }
            } else {
                return message.reply('Invalid environment');
            }
            break;
        }
        }
    }

    async exec(message, args) {
        switch (message.util.alias) {
        case 'set':
            await this.runSet(message, args);
            break;
        case 'get':
            await this.runGet(message, args);
            break;
        case 'run':
            await this.runRun(message, args);
            break;
        default:
            await message.reply(this.client._('bot.invalid_request'));
            break;
        }
    }
}

module.exports = UtilCommand;
