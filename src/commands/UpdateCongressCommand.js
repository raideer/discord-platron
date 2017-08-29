const Command = require('../PlatronCommand');
const winston = require('winston');

class UpdateCongressCommand extends Command {
    constructor() {
        super('updateCongress', {
            aliases: ['updateCongress'],
            ownerOnly: true,
            channelRestriction: 'guild'
        });
    }

    exec(message, args) {

        if (this.client.cronHandler) {
            winston.info('Running updateCongress command');
            const roleSetter = this.client.cronHandler.modules.get('partyRoleSetter');

            if (roleSetter) {
                winston.info('Running partyRoleSetter module');

                message.reply('Running partyRoleSetter module');
                roleSetter.exec();
            } else {
                winston.error('Party role setter not found')
            }
        } else {
            message.reply('Cron module is not set up');
        }
    }
}

module.exports = UpdateCongressCommand;
