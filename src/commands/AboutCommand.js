const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');

class AboutCommand extends Command {
    constructor() {
        super('about', {
            aliases: ['about', 'version', 'v'],
            description: () => {
                return this.client._('command.about.description');
            },
            usage: 'about',
            allowWhenDisabled: true
        });
    }

    exec(message) {
        const vt = this.client.localize.translate('command.about.version', `v${require('../../package.json').version}`);

        if (message.util.alias == 'v') {
            return message.channel.send(vt);
        }

        const embed = new RichEmbed();
        embed.setTitle('Discord PlaTRON');
        embed.setThumbnail('http://i.imgur.com/3piWqcG.png');
        embed.setDescription(
            this.client.localize.translate('command.about.description', '[Industrials](https://www.erepublik.com/en/citizen/profile/8075739)')
        );

        embed.setFooter(`💚 ${vt}`);
        embed.setColor(3186940);

        return message.channel.send({ embed });
    }
}

module.exports = AboutCommand;
