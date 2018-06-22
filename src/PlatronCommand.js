const { Command } = require('discord-akairo');
const { RichEmbed } = require('discord.js');
const _ = require('lodash');

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

        this.description = options.description || '';
        this.usage = options.usage || '';
        // this.usageExamples = options.usageExamples || [];
        this.usageNote = options.usageNote || '';
        this.allowWhenDisabled = !!options.allowWhenDisabled;
        this.showInHelp = typeof options.showInHelp === 'undefined' ? true : !!options.showInHelp;
    }

    async deleteMessage(message, timeout = 10000) {
        if (!message.guild) {
            return;
        }

        await new Promise(resolve => setTimeout(() => {
            message.delete().then(resolve);
        }, timeout));
    }

    async getUsage(prefix = '!') {
        const resolveStringOrFunction = this.client.platron_utils.resolveStringOrFunction;
        const embed = new RichEmbed();
        const aliases = _.drop(this.aliases).length > 0 ? `(${_.drop(this.aliases).join(' | ')})` : '';

        const description = await resolveStringOrFunction(this.description);
        const usage = await resolveStringOrFunction(this.usage);
        const notes = await resolveStringOrFunction(this.usageNote);

        embed.setTitle(`Command: ${_.first(this.aliases)} ${aliases}`);
        embed.setDescription(description);

        if (usage) {
            if (Array.isArray(usage)) {
                embed.addField('Usage', usage.map(usage => `\`${prefix}${usage}\``).join('\n'));
            } else {
                embed.addField('Usage', `\`${prefix}${usage}\``);
            }
        }

        if (notes) {
            embed.setFooter(notes);
        }

        return embed;
    }
};
