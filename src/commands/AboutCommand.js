const { Command } = require('discord-akairo');
const { RichEmbed } = require('discord.js');

class AboutCommand extends Command {
    constructor() {
        super('about', {
            aliases: ['about', 'version']
        });
    }

    exec(message) {
        const embed = new RichEmbed();
        embed.setTitle("Discord PlaTRON");
        embed.setThumbnail("http://i.imgur.com/3piWqcG.png");
        embed.setDescription(
            this.client.localize.translate("bot.about.description", "[Industrials](https://www.erepublik.com/en/citizen/profile/8075739)")
        );

        const vt = this.client.localize.translate("bot.about.version", `v${require('../../package.json').version}`);
        embed.setFooter(`💚 ${vt}`);
        embed.setColor(3186940);

        return message.channel.send({embed: embed});
    }
}

module.exports = AboutCommand;
