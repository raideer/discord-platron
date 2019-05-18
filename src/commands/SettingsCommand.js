const Command = require('../PlatronCommand');

class SettingsCommand extends Command {
    constructor() {
        super('settings', {
            aliases: ['config', 'settings'],
            args: [
                {
                    id: 'op',
                    types: ['get', 'set', 'clear', 'info']
                },
                {
                    id: 'setting'
                },
                {
                    id: 'value',
                    match: 'rest',
                    default: ''
                }
            ],
            channelRestriction: 'guild',
            description: 'Configure various things',
            usage: [
                'config info <setting>',
                'config get <setting>',
                'config clear <setting>',
                'config set prefix <prefix>',
                'config set locale <en | lv>',
                'config set channel <discord_text_channel>'
            ],
            notes: 'Can only be used by an administrator',
            allowWhenDisabled: true
        });
    }

    userPermissions(message) {
        const isOwner = Array.isArray(this.client.ownerID)
                ? this.client.ownerID.includes(message.author.id)
                : message.author.id === this.client.ownerID;

        return message.channel.permissionsFor(message.author).has('ADMINISTRATOR')
        || isOwner;
    }

    setSetting(message, setting, value) {
        const otherSettings = [
            ['autoDeleteMessages', 'boolean'],
            ['setVerifiedRoles', 'boolean'],
            ['setCountryRoles', 'boolean'],
            ['setDivisionRoles', 'boolean'],
            ['setMavericRoles', 'boolean'],
            ['setMURoles', 'boolean'],
            ['countryRole', 'role'],
            ['setPartyRoles', 'boolean'],
            ['setCongressRoles', 'boolean'],
            ['epicNotificator', 'channel'],
            ['greetMembers', 'boolean'],
            ['enableCommands', 'boolean'],
            ['greetMessage', 'string'],
            ['congressList', 'string'],
        ];

        const subject = otherSettings.find(f => f[0] == setting);

        if (subject) {
            value = this.client.settings.resolveValue(value, subject[1], message.guild);
            if (subject[1] === 'role' || subject[1] === 'channel') {
                if (value) {
                    value = value.id;
                } else {
                    value = false;
                }
            }

            this.client.settings.set(message.guild, setting, value);
            return message.util.reply(`:white_check_mark: \`${setting}\` has been set to \`${value}\``);
        }

        switch (setting) {
        case 'prefix':
            if (value.length > 2) {
                return message.util.reply(':no_entry: Prefix can\'t be longer than **2 characters**!');
            }

            this.client.settings.set(message.guild, 'prefix', value);
            break;
        case 'locale':
            const locales = ['en', 'lv'];
            if (locales.indexOf(value) < 0) {
                return message.util.reply(`:no_entry: Only the following locales are supported: ${locales.map(l => `\`${l}\``).join(', ')}`);
            }

            this.client.settings.set(message.guild, 'locale', value);
            break;
        case 'channel':
            const channel = this.client.util.resolveChannel(value, message.guild.channels);
            if (channel.type !== 'text') {
                return message.util.reply(`:no_entry: Channel \`${channel.name}\` is not a text channel!`);
            }

            this.client.settings.set(message.guild, 'channel', channel.id);

            return message.util.reply(`:white_check_mark: I'm now restricted to only <#${channel.id}>`);
        default:
            return message.util.reply(`:no_entry: Setting \`${setting}\` is not recognised`);
        }

        message.util.reply(`:white_check_mark: \`${setting}\` has been set to \`${value}\``);
    }

    exec(message, args) {
        switch (args.op) {
        case 'get': {
            const value = this.client.settings.get(message.guild, args.setting, null);
            if (value === null) {
                return message.util.reply(`:no_entry: Setting \`${args.setting}\` does not exist in this guild`);
            }

            message.util.reply(`:white_check_mark: **${args.setting}** is set to \`${value}\``);
            break;
        }
        case 'set': {
            this.setSetting(message, args.setting, args.value);
            break;
        }
        case 'clear': {
            const value = this.client.settings.get(message.guild, args.setting, null);
            if (value === null) {
                return message.util.reply(`:no_entry: Setting \`${args.setting}\` does not exist in this guild`);
            }

            this.client.settings.clear(message.guild, args.setting);
            message.util.reply(`:white_check_mark: Setting **${args.setting}** is cleared`);
            break;
        }
        case 'info': {
            switch (args.setting) {
            case 'prefix':
                return message.util.reply(':information_source:  Sets the prefix for all commands. `!` by default');
            case 'locale':
                return message.util.reply(':information_source:  Set the default language for PlaTRON\'s replies');
            case 'channel':
                return message.util.reply(':information_source:  Limit all commands to a specific channel');
            }

            break;
        }
        default: {
            message.util.sendEmbed(this.getUsage(message.util.prefix));
            break;
        }
        }
    }
}

module.exports = SettingsCommand;
