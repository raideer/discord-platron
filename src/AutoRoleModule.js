const { AkairoModule } = require('discord-akairo');
const winston = require('winston');

class AutoRoleModule extends AkairoModule {
    constructor(id, options) {
        super(id, options);

        if (!options.roleKey) {
            throw `Role Key not set for ${id}`;
        }

        if (!options.roleOptions) {
            throw `Role options not set for ${id}`;
        }

        this.roleKey = options.roleKey;
        this.roleOptions = options.roleOptions;
    }

    isEnabled() {
        return true;
    }

    isEligible() {
        winston.error('Super "isEligible" not overriden for AutoRoleModule', this.id);
        return false;
    }
}
module.exports = AutoRoleModule;
