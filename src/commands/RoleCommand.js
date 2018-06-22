const Command = require('../PlatronCommand');

class RoleCommand extends Command {
    constructor() {
        super('role', {
            aliases: ['role', 'roles'],
            args: [
                {
                    id: 'op',
                    types: ['get', 'set', 'clear']
                },
                {
                    id: 'role'
                },
                {
                    id: 'value',
                    match: 'rest',
                    default: ''
                }
            ],
            userPermissions: ['ADMINISTRATOR'],
            channelRestriction: 'guild',
            description: 'Configure roles for this guild',
            usage: [
                'role set div1 <role>',
                'role set div2 <role>',
                'role set div3 <role>',
                'role set div4 <role>',
                'role set maveric <role>'
            ],
            notes: 'Can only be used by an administrator',
            allowWhenDisabled: true
        });
    }

    setRole(message, role, value) {
        const roles = [
            ['div1', 'division'],
            ['div2', 'division'],
            ['div3', 'division'],
            ['div4', 'division'],
            ['maveric', 'maveric'],
        ];

        if (!roles.some(r => r[0] == role)) {
            return message.util.reply(`:no_entry: \`${role}\` is not a valid role!`);
        }

        const roleObject = this.client.util.resolveRole(value, message.guild.roles);
        if (!roleObject) {
            return message.util.reply(`:no_entry: Could not find role: \`${role}\``);
        }
        
        const roleGroup = roles.find(r => r[0] == role)[1];
        this.client.roles.set(message.guild, role, roleObject.id, roleGroup);

        message.util.reply(`:white_check_mark: \`${role}\` has been set to \`${roleObject.name}\` (\`${roleObject.id}\`)`);
    }

    exec(message, args) {
        switch (args.op) {
        case 'get': {
            const value = this.client.roles.get(message.guild, args.role);
            if (value === null) {
                return message.util.reply(`:no_entry: Role \`${args.role}\` does not exist in this guild`);
            }

            message.util.reply(`:white_check_mark: **${args.role}** is set to \`${value.id}\``);
            break;
        }
        case 'set': {
            this.setRole(message, args.role, args.value);
            break;
        }
        case 'clear': {
            const value = this.client.roles.get(message.guild, args.role);
            if (value === null) {
                return message.util.reply(`:no_entry: Role \`${args.role}\` does not exist in this guild`);
            }

            this.client.roles.clear(message.guild, args.role);
            message.util.reply(`:white_check_mark: Role **${args.role}** is cleared`);
            break;
        }
        default: {
            message.util.sendEmbed(this.getUsage(message.util.prefix));
            break;
        }
        }
    }
}

module.exports = RoleCommand;
