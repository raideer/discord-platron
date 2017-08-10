const { Command } = require('discord-akairo');
const { RichEmbed } = require('discord.js');

class AboutCommand extends Command {
    constructor() {
        super('about', {
            aliases: ['about', 'version']
        });
    }

    exec(message) {
        console.log(message.locale);

        const embed = new RichEmbed();
        embed.setTitle("Discord PlaTRON");
        embed.setThumbnail("http://i.imgur.com/3piWqcG.png");
        embed.setDescription("Multi purpose eRepublik discord bot by [Industrials](https://www.erepublik.com/en/citizen/profile/8075739)");
        embed.setFooter(`💚 Currently running version v${require('../../package.json').version}`);
        embed.setColor(3186940);

        return message.channel.send({embed: embed});
    }
}

module.exports = AboutCommand;
