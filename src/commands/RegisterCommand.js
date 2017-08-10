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
                    return message.reply(`Citizen with ID ${args.user} was not found`);
                }

                const $ = cheerio.load(body);

                // console.log('User id', args.user);
                //
                // console.log($('.citizen_profile_header h2').text());

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
                                    message.reply(`:white_check_mark: Your ownership of citizen **${args.user}** has been verified!\n You can now remove the verification code from your profile page :thumbsup:`)
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
                            return message.reply(`:information_source: To verify your ownership of **${args.user}**, please add \`[tron=${code}]\` to your eRepublik account's __About me__ section and then run this command again.`);
                        });
                    }
                });
            });
        }
    }
}

module.exports = RegisterCommand;
