const Command = require('../PlatronCommand');
const { citizenNameToId } = require('../utils');
const request = require('request');
const cheerio = require('cheerio');
const winston = require('winston');

class RegisterCommand extends Command {
    constructor() {
        super('register', {
            aliases: ['register'],
            args: [
                {
                    id: 'user',
                    type: 'dynamicInt',
                    match: 'rest'
                }
            ],
            description: () => {
                return this.client._('command.register.description');
            },
            usage: 'register YOUR_CITIZEN_ID',
            usageNote: () => {
                return this.client._('command.register.usage_note');
            }
        });
    }

    verifyCode($, code) {
        if (!code) {
            return null;
        }

        if (code.length !== 5) {
            return null;
        }

        let about_me = $('.about_message.profile_section').text();
        let regex = new RegExp(`\\[tron\\=(${code})\\]`);
        let match = about_me.match(regex);

        if (match) {
            return true;
        }

        return false;
    }

    generateCode(){
        return (Math.random() + 1).toString(36).substr(2, 5);
    }

    exec(message, args) {
        if (!args.user) {
            return this.client.emit('invalidUsage', message, this);
        }

        if (Number.isInteger(args.user)) {
            winston.info('Attempting to register', args.user);

            request.get(`https://www.erepublik.com/en/citizen/profile/${args.user}`, (error, response, body) => {
                if (error) {
                    winston.error('Received error when registering', args.user, error);
                    return message.reply('Something went wrong while processing your request').then(reply => {
                        this.deleteMessage(message);
                        this.deleteMessage(reply);
                    });
                }

                if (response.statusCode == 404) {
                    winston.warn('Didn\'t find a user with id', args.user);
                    return message.reply(this.client._('user_not_found', `**${args.user}**`)).then(reply => {
                        this.deleteMessage(message);
                        this.deleteMessage(reply);
                    });
                }

                const $ = cheerio.load(body);

                const db = this.client.databases.citizens.table;

                // Finding citizen with the provided ID in the db
                db.findById(args.user).then(user => {
                    // If the user was found
                    if (user) {
                        winston.verbose('Found citizen with id', user.id);
                        if (user.verified === false || user.reclaiming === true) {
                            const verify = this.verifyCode($, user.code);

                            //If code is in the about me page
                            if (verify) {
                                winston.verbose('Successfully verified code for', user.id);
                                user.verified = true;
                                user.code = null;
                                user.discord_id = message.author.id;
                                user.reclaiming = false;

                                return user.save().then(() => {
                                    if (this.client.cronHandler && message.guild) {
                                        const roleSetter = this.client.cronHandler.modules.get('partyRoleSetter');

                                        if (roleSetter) {
                                            winston.info('Running partyRoleSetter module');
                                            roleSetter._processMember(message.member, message.guild);
                                        } else {
                                            winston.error('Party role setter not found')
                                        }
                                    }

                                    const l_verified = this.client._('command.register.verified', `**${args.user}**`);
                                    const l_verified1 = this.client._('command.register.verified1');

                                    message.reply(`:white_check_mark: ${l_verified}\n ${l_verified1} :thumbsup:`).then(reply => {
                                        this.deleteMessage(message);
                                        this.deleteMessage(reply);
                                    });
                                });
                            } else if(verify === false) {
                                winston.warn('Code didn\'t match for', args.user);
                                //If code doesn't match
                                return message.reply(this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${user.code}]\``)).then(reply => {
                                    this.deleteMessage(message);
                                    this.deleteMessage(reply);
                                });
                            } else {
                                winston.warn('Code invalid for', args.user);
                                //If invalid code
                                const code = this.generateCode();
                                user.code = code;
                                user.save().then(() => {
                                    return message.reply(`:arrows_counterclockwise: Something went wrong! Please add \`[tron=${code}]\` to your **About me** section and try again`).then(reply => {
                                        this.deleteMessage(message);
                                        this.deleteMessage(reply);
                                    });
                                });
                            }
                        } else {
                            const owner = this.client.util.resolveUser(user.discord_id, this.client.users);
                            if (owner.id == message.author.id) {
                                return message.reply(`:white_check_mark: ${this.client._('command.register.already_verified')}!`).then(reply => {
                                    this.deleteMessage(message);
                                    this.deleteMessage(reply);
                                });
                            }

                            const l_already_claimed = this.client._('command.register.already_claimed', `\`${args.user}\``, `<@${owner.id}>\n:arrows_counterclockwise: __`);
                            const l_options = this.client._('bot.prompt.options', `**yes**`, `**no**`);

                            return this.client.util.prompt(
                                message,
                                `${l_already_claimed}?__ (${l_options})`,
                                () => true,
                                30000,
                                {
                                    reply: message.author
                                }
                            ).then((promt) => {
                                if (promt.content.startsWith('y')) {
                                    const code = this.generateCode();
                                    user.reclaiming = true;
                                    user.code = code;
                                    user.save().then(() => {
                                        message
                                            .reply(`Ok :ok_hand:. ${this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``)}`).then(reply => {
                                                this.deleteMessage(message);
                                                this.deleteMessage(reply);
                                            });
                                    });
                                }
                            });
                        }
                    //If the user wasnt found in the database
                    } else {
                        winston.verbose('Generating code for', args.user);
                        const code = this.generateCode();
                        db.create({
                            id: args.user,
                            discord_id: message.author.id,
                            code: code
                        }).then(() => {
                            const l_add_code = this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``);
                            return message.reply(`:information_source: ${l_add_code}.`).then(reply => {
                                this.deleteMessage(message);
                                this.deleteMessage(reply);
                            });
                        });
                    }
                });
            });
        }
    }
}

module.exports = RegisterCommand;
