const Command = require('../PlatronCommand');
const request = require('request-promise');

class ShowerCommand extends Command {
    constructor() {
        super('showerThougts', {
            aliases: ['thinking', 'shower'],
            description: () => {
                return 'Returns a random shower thought';
            },
            usage: 'thinking'
        });
    }

    async exec(message) {
        const thoughts = await request({
            method: 'GET',
            json: true,
            uri: 'https://www.reddit.com/r/showerthoughts/top.json?limit=50&t=week'
        });

        const i = Math.floor(Math.random() * thoughts.data.children.length);
        await message.channel.send(`${thoughts.data.children[i].data.title} :thinking:`);
    }
}

module.exports = ShowerCommand;
