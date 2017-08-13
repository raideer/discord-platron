const { Command } = require('discord-akairo');

module.exports = class PlatronCommand extends Command {
    constructor(id, exec, options) {
        if (!options && typeof exec === 'object') {
            options = exec;
            exec = null;
        }

        super(id, exec, options);


        this.description = options.description || "";
        this.usage = options.usage || "";
        this.usageExamples = options.usageExamples || [];
        this.usageNote = options.usageNote || "";
        this.showInHelp = !!options.showInHelp;
    }
}
