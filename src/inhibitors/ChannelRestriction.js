const { Inhibitor } = require('discord-akairo');

class ChannelRestriction extends Inhibitor {
    constructor() {
        super('channelRestriction', {
            reason: 'channel'
        });
    }

    exec(message) {
        const channel = this.client.settings.get(message.guild, 'channel');
        if (!channel) return false;

        return message.channel.id != channel;
    }
}

module.exports = ChannelRestriction;