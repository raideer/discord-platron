const { Inhibitor } = require('discord-akairo');
const Localize = require('localize');

function exec(message) {
    const blacklist = message.client.databases.blacklist.items;
    return blacklist.has(message.author.id);
}

module.exports = new Inhibitor('blacklist', exec, {
    reason: 'blacklist'
});
