const { AkairoHandler } = require('discord-akairo');
const AutoRoleModule = require('./AutoRoleModule');

class AutoRoleHandler extends AkairoHandler {
    constructor(client, options) {
        super(client, options.rolesDirectory, AutoRoleModule);
    }
}

module.exports = AutoRoleHandler;
