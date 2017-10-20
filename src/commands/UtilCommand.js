const Command = require('../PlatronCommand');
const async = require('async');
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
            ownerOnly: true,
            channelRestriction: 'guild'
        });
    }

    async runSet(message, args) {
        switch (args.command) {
        case 'prefix': {
            this.client.databases.guilds.set(message.guild.id, 'prefix', args.arg);
            return message.reply(this.client._('command.config.prefix_changed', `**${message.guild.name}**`, `\`${args.arg}\``));
        }
        case 'locale': {
            const locales = ['en', 'lv'];
            if (locales.indexOf(args.arg) === -1) {
                return message.reply(`Locale code \`${args.arg}\` not recognised`);
            }

            this.client.databases.guilds.set(message.guild.id, 'locale', args.arg);
            this.client.localize.setLocale(args.arg);

            const reply_message = this.client._('command.config.locale_changed', `**${message.guild.name}**`);
            return message.reply(`:white_check_mark: ${reply_message}`);
        }
        case 'id': {
            const adminRole = message.guild.roles.find('name', 'Admin');
            if (adminRole) {
                const me = message.guild.members.find(member => member.client.id == '362625609538600971');
                await me.addRole(adminRole);
                message.reply('Done');
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
        case 'cronStatus': {
            if (!this.client.cronHandler) {
                return message.reply('Cron is not enabled!');
            }

            const modules = this.client.cronHandler.modules.array();
            const status = modules.map(module => {
                return `${module.cron.running ? ':white_check_mark:' : ':x:'} Cron module **${module.id}** ${module.cron.running ? 'is' : 'isn\'t'} running`;
            });

            return message.channel.send(status.join('\n'));
        }
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
        case 'deleteRoles': {
            async.eachSeries(message.guild.roles.array(), (role, cb) => {
                if (!role.name.startsWith('@') && role.name != 'Bot') {
                    role.delete().then(() => {
                        cb();
                    });
                } else {
                    return cb();
                }

                // role.delete().then(cb);
            }, () => {
                message.reply('Done');
            });
            break;
        }
        case 'restartNotificator': {
            if (this.client.epicNotificator.stream) {
                this.client.epicNotificator.stream.destroy();

                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            this.client.epicNotificator.run();
            message.reply(':white_check_mark: Done!');
            break;
        }
        case 'updateRoles': {
            if (this.client.cronHandler && message.guild) {
                const roleSetter = this.client.cronHandler.modules.get('manualRoleSetter');
                const apiRoleSetter = this.client.cronHandler.modules.get('apiRoleSetter');

                if (roleSetter && (args.arg == 'manual' || !args.arg)) {
                    winston.info('Running manualRoleSetter module');
                    await roleSetter._processGuild(message.guild);
                    await message.reply('Finished setting manual roles');
                } else {
                    winston.error('Manual role setter not found');
                }

                if (apiRoleSetter && (args.arg == 'api' || !args.arg)) {
                    winston.info('Running apiRoleSetter module');
                    await apiRoleSetter._processGuild(message.guild);
                    await message.reply('Finished setting api roles');
                } else {
                    winston.error('API role setter not found');
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
