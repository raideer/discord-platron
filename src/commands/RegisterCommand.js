const { Command } = require('discord-akairo');
const { citizenNameToId } = require('../utils');
const request = require('request');
const cheerio = require('cheerio');

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
            ]
        });
    }

    verifyCode($, code) {
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
        if (Number.isInteger(args.user)) {
            request.get(`https://www.erepublik.com/en/citizen/profile/${args.user}`, (error, response, body) => {
                if (error) {
                    return message.reply('Something went wrong while processing your request');
                }

                if (response.statusCode == 404) {
                    return message.reply(this.client._('user_not_found', `**${args.user}**`));
                }

                const $ = cheerio.load(body);

                const db = this.client.databases.citizens.table;

                db.findById(args.user).then(user => {
                    if (user) {
                        if (user.code && user.verified === false || user.code && user.reclaiming === true) {
                            const verify = this.verifyCode($, user.code);

                            //If code is in the about me page
                            if (verify) {
                                user.verified = true;
                                user.code = null;
                                user.discord_id = message.author.id;
                                user.reclaiming = false;

                                return user.save().then(() => {
                                    const l_verified = this.client._('command.register.verified', `**${args.user}**`);
                                    const l_verified1 = this.client._('command.register.verified1');

                                    message.reply(`:white_check_mark: ${l_verified}\n ${l_verified1} :thumbsup:`)
                                });
                            } else if(verify === false) {
                                //If code doesn't match
                                return message.reply(this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${user.code}]\``));
                            } else {
                                //If invalid code
                                const code = this.generateCode();
                                user.code = code;
                                user.save().then(() => {
                                    return message.reply(`:arrows_counterclockwise: Something went wrong! Please add \`[tron=${code}]\` to your **About me** section and try again`);
                                });
                            }
                        } else {
                            const owner = this.client.util.resolveUser(user.discord_id, this.client.users);
                            if (owner.id == message.author.id) {
                                return message.reply(`:white_check_mark: ${this.client._('command.register.already_verified')}!`)
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
                                            .reply(`Ok :ok_hand:. ${this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``)}`);
                                    });
                                }
                            });
                        }
                    } else {
                        const code = this.generateCode();
                        db.create({
                            id: args.user,
                            discord_id: message.author.id,
                            code: code
                        }).then(() => {
                            const l_add_code = this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``);
                            return message.reply(`:information_source: ${l_add_code}.`)
                        });
                    }
                });
            });
        }
    }
}

module.exports = RegisterCommand;
