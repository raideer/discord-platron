const { Listener } = require('discord-akairo');
const winston = require('winston');

async function exec(member) {
    winston.info(member.user.username, 'joined guild', member.guild.name);

    const greetMembers = await this.client.guildConfig(member.guild, 'greetMembers', false);

    if (!greetMembers) {
        return;
    }

    const defaultMessage = await this.client.guildConfig(member.guild, 'greetMessage', false);

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

module.exports = new Listener('memberJoin', exec, {
    emitter: 'client',
    eventName: 'guildMemberAdd'
});
