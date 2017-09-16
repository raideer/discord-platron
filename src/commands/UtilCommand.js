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
                    id: 'arg1',
                    type: 'string'
                },
                {
                    id: 'arg2',
                    type: 'string'
                }
            ],
            ownerOnly: true,
            channelRestriction: 'guild'
        });
    }

    runSet(message, args) {
        switch (args.command) {
        case 'prefix': {
            this.client.databases.guilds.set(message.guild.id, 'prefix', args.arg1);
            return message.reply(this.client._('command.config.prefix_changed', `**${message.guild.name}**`, `\`${args.arg1}\``));
        }
        case 'locale': {
            const locales = ['en', 'lv'];
            if (locales.indexOf(args.arg1) === -1) {
                return message.reply(`Locale code \`${args.arg1}\` not recognised`);
            }

            this.client.databases.guilds.set(message.guild.id, 'locale', args.arg1);
            this.client.localize.setLocale(args.arg1);

            const reply_message = this.client._('command.config.locale_changed', `**${message.guild.name}**`);
            return message.reply(`:white_check_mark: ${reply_message}`);
        }
        default:
            return message.reply(this.client._('bot.invalid_request'));
        }
    }

    runGet(message, args) {
        switch (args.command) {
        case 'link':
            return message.reply(`<https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=268435464>`);
        }
    }

    runRun(message, args) {
        switch (args.command) {
        case 'deleteRoles': {
            async.eachSeries(message.guild.roles.array(), (role, cb) => {
                if (!role.name.startsWith('@') && role.name != 'Bot') {
                    console.log('Deleting', role.name);
                    role.delete().then(() => {
                        console.log('Deleted', role.name);
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
        case 'updateRoles': {
            const User = this.client.util.resolveUser(args.arg1, this.client.users);
            if (!User) {
                return message.reply('User not found');
            }

            const Citizen = this.client.databases.citizens.table;
            Citizen.findOne({
                where: {
                    discord_id: User.id
                }
            }).then(citizen => {
                if (!citizen) {
                    return message.reply('User not registered');
                }

                if (!citizen.verified) {
                    return message.reply('User not verified');
                }

                if (this.client.cronHandler && message.guild) {
                    const roleSetter = this.client.cronHandler.modules.get('partyRoleSetter');

                    if (roleSetter) {
                        winston.info('Running partyRoleSetter module');
                        roleSetter._processMember(message.member, message.guild).then(() => {
                            message.reply('Done');
                        });
                    } else {
                        winston.error('Party role setter not found');
                    }
                } else {
                    return message.reply('Invalid environment');
                }
            });
            break;
        }
        }
    }

    exec(message, args) {
        switch (message.util.alias) {
        case 'set':
            this.runSet(message, args);
            break;
        case 'get':
            this.runGet(message, args);
            break;
        case 'run':
            this.runRun(message, args);
            break;
        default:
            message.reply(this.client._('bot.invalid_request'));
            break;
        }
    }
}

module.exports = UtilCommand;
