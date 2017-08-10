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
                                return message.reply(`:information_source: Please add \`[tron=${user.code}]\` to your **About me** section`);
                            } else {
                                const code = this.generateCode();
                                user.code = code;
                                user.save().then(() => {
                                    return message.reply(`:arrows_counterclockwise: Something went wrong! Please add \`[tron=${code}]\` to your **About me** section and try again`);
                                });
                            }
                        } else {
                            const owner = this.client.util.resolveUser(user.discord_id, this.client.users);
                            if (owner.id == message.author.id) {
                                return message.reply(`:white_check_mark: You have already successfully claimed this account!`)
                            }

                            return this.client.util.prompt(
                                message,
                                `Citizen with the ID \`${args.user}\` is already claimed by <@${owner.id}>\n:arrows_counterclockwise: __Would you like to reclaim this account?__ (type **yes** or **no**)`,
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
                                            .reply(`Ok :ok_hand:. Please add \`[tron=${code}]\` to your eRepublik account's __About me__ section and then run this command again.`);
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
