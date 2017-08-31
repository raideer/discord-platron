const { Command } = require('discord-akairo');

module.exports = class PlatronCommand extends Command {
    constructor(id, exec, options) {
        if (!options && typeof exec === 'object') {
            options = exec;
            exec = null;
        }

        if (!options.args) {
            options.args = [];
        }

        options.args.push({
            id: '_lang',
            match: 'prefix',
            prefix: ['--lang=', '--l=']
        });

        options.args.push({
            id: '_en',
            match: 'flag',
            prefix: ['--en', '-en']
        });

        options.args.push({
            id: '_lv',
            match: 'flag',
            prefix: ['--lv', '-lv']
        });

        super(id, exec, options);

        this.description = options.description || "";
        this.usage = options.usage || "";
        this.usageExamples = options.usageExamples || [];
        this.usageNote = options.usageNote || "";
        this.showInHelp = !!options.showInHelp;
    }

    deleteMessage(message, timeout = 10000) {
        setTimeout(() => {
            message.delete();
        }, timeout);
    }
}
