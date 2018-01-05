const { Inhibitor } = require('discord-akairo');

async function exec(message, command) {
    const content = this.client.commandHandler._parseCommand(message, false).content;

    let locale = null;

    if (content) {
        const args = await command.parse(content, message);

        if (args._lang) {
            locale = args._lang;
        } else if (args._en) {
            locale = 'en';
        } else if (args._lv) {
            locale = 'lv';
        }
    }

    if (!locale) {
        if (message.guild) {
            locale = this.client.databases.guilds.get(message.guild.id, 'locale', 'en');
        } else {
            locale = 'en';
        }
    }

    this.client.localize.setLocale(locale);
    message.locale = locale;
    return false;
}

module.exports = new Inhibitor('localizer', exec, {
    reason: 'localized'
});
