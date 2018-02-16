const { Listener } = require('discord-akairo');
const winston = require('winston');

module.exports = class MemberJoinListener extends Listener {
    constructor() {
        super('memberJoin', {
            emitter: 'client',
            eventName: 'guildMemberAdd'
        });
    }

    async exec(member) {
        winston.info(member.user.username, 'joined guild', member.guild.name);

        const greetMembers = await this.client.guildConfig(member.guild, 'greetMembers', false);

        if (!greetMembers) {
            return;
        }

        let defaultMessage = await this.client.guildConfig(member.guild, 'greetMessage', false);
        if (defaultMessage == '0') {
            defaultMessage = false;
        }

        const channel = member.guild.channels.get(greetMembers);
        if (channel) {
            let message;

            if (defaultMessage) {
                message = defaultMessage;
                message = message.replace(/{user}/gi, `<@${member.user.id}>`);
                message = message.replace(/{guild}/gi, member.guild.name);
            } else {
                message = `:tada: Welcome <@${member.user.id}> to the **${member.guild.name}** discord channel!\n`;
                message += 'To get access to more channels and benefits, please type `!register YOUR_EREP_ID` in the chat and follow the instructions';
            }

            channel.send(message);
        }
    }
};
