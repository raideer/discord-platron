const { Command } = require('discord-akairo');

class AboutCommand extends Command {
    constructor() {
        super('about', {
            aliases: ['about', 'version']
        });
    }

    exec(message) {
        return message.channel.send(`**Discord PlaTRON** (\`v${require('../../package.json').version}\`) made by **raideer**`);
    }
}

module.exports = AboutCommand;
