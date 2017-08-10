const { Inhibitor } = require('discord-akairo');
const Localize = require('localize');

const localizations = new Localize('../../');

function exec(message) {
    message.locale = 'en';
}

module.exports = new Inhibitor('localizer', exec, {
    reason: 'localized'
});
