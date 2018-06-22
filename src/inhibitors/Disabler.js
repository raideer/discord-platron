const { Inhibitor } = require('discord-akairo');

module.exports = class CommandDisabler extends Inhibitor {
    constructor() {
        super('disabler', {
            reason: 'disabled'
        });
    }

    async exec(message, command) {
        const enabled = await this.client.settings.get(message.guild, 'enableCommands', false);

        if (!enabled && !command.allowWhenDisabled) {
            return Promise.reject();
        }

        return Promise.resolve();
    }
};
