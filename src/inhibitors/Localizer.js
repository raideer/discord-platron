const { Inhibitor } = require('discord-akairo');

module.exports = class CommandLocalizer extends Inhibitor {
    constructor() {
        super('localizer', {
            reason: 'localized'
        });
    }

    async exec(message, command) {
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
                locale = this.client.settings.get(message.guild, 'locale', 'en');
            } else {
                locale = 'en';
            }
        }

        this.client.localize.setLocale(locale);
        message.locale = locale;
        return false;
    }
};
