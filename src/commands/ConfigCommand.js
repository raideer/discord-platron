const Command = require('../PlatronCommand');
const _ = require('lodash');

class ConfigCommand extends Command {
    constructor() {
        super('config', {
            aliases: ['config'],
            args: [
                {
                    id: 'action',
                    type: ['set', 'get'],
                    default: 'set'
                },
                {
                    id: 'field',
                    type: 'string'
                },
                {
                    id: 'value',
                    type: 'string'
                }
            ],
            ownerOnly: true,
            channelRestriction: 'guild',
            showInHelp: false
        });
    }

    async exec(message, args) {
        const Config = this.client.databases.config.table;

        switch (args.action) {
        case 'set': {
            let value = args.value;
            if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }

            const config = _.first(await Config.findOrCreate({
                where: {
                    field: args.field,
                    guild_id: message.guild.id
                },
                defaults: {
                    value: value
                }
            }));

            config.value = value;
            await config.save();
            message.reply(`${args.field} has been set to ${value}`);
            break;
        }
        case 'get':
            Config.find({
                where: {
                    field: args.field,
                    guild_id: message.guild.id
                }
            }).then(config => {
                if (config) {
                    message.reply(`**${args.field}** is \`${config.value}\``);
                } else {
                    message.reply(`**${args.field}** doesn't exist`);
                }
            });
            break;
        }
    }
}

module.exports = ConfigCommand;
