const { Inhibitor } = require('discord-akairo');

async function exec(message, command) {
    const enabled = await this.client.guildConfig(message.guild, 'enableCommands', true, true);
    
    if (!enabled && !command.allowWhenDisabled) {
        return Promise.reject();
    }
    
    return Promise.resolve();
}

module.exports = new Inhibitor('disabler', exec, {
    reason: 'disabled'
});
