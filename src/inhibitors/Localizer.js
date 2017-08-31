const { Inhibitor } = require('discord-akairo');

function exec(message, command, args) {
    return new Promise((resolve, reject) => {
        const content = this.client.commandHandler._parseCommand(message, false).content;
        command.parse(content, message).then(args => {
            let locale = 'en'

            if (args._lang) {
                locale = args._lang;
            } else if(args._en) {
                locale = 'en';
            } else if (args._lv) {
                locale = 'lv';
            } else {
                if (message.guild) {
                    locale = this.client.databases.guilds.get(message.guild.id, 'locale', 'en');
                }
            }

            this.client.localize.setLocale(locale);
            message.locale = locale;

            resolve();
        });
    });
}

module.exports = new Inhibitor('localizer', exec, {
    reason: 'localized'
});
