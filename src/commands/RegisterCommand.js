const Command = require('../PlatronCommand');
const { Collection } = require('discord.js');
const request = require('request-promise');
const cheerio = require('cheerio');
const winston = require('winston');

class RegisterCommand extends Command {
    constructor() {
        super('register', {
            aliases: ['register'],
            args: [
                {
                    id: 'user',
                    type: 'citizenId',
                    match: 'rest'
                }
            ],
            description: () => {
                return this.client._('command.register.description');
            },
            usage: () => {
                return `register ${this.client._('command.register.usage_note')}`;
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

        const about_me = $('.about_message.profile_section').text();
        const regex = new RegExp(`\\[tron\\=(${code})\\]`);
        const match = about_me.match(regex);

        if (match) {
            return true;
        }

        return false;
    }

    generateCode() {
        return (Math.random() + 1).toString(36).substr(2, 5);
    }

    async _deleteMessageAndReply(message, reply, timeout = 20000) {
        const del = await this.client.guildConfig(message.guild, 'autoDeleteMessages', true);
        if (del) {
            this.deleteMessage(message, timeout);
            this.deleteMessage(reply, timeout);
        }
    }

    async _addRoles(message, user) {
        const roleSetter = this.client.cronHandler.modules.get('manualRoleSetter');
        const apiroleSetter = this.client.cronHandler.modules.get('apiRoleSetter');

        const fakeColl = new Collection();
        fakeColl.set(user.id, {
            citizen: user,
            member: message.member
        });

        winston.info('Running apiRoleSetter module');
        await apiroleSetter._processGuild(message.guild, fakeColl);
        winston.info('Running manualRoleSetter module');
        await roleSetter._processGuild(message.guild, fakeColl);
    }

    async exec(message, args) {
        if (!args.user) {
            return this.client.emit('invalidUsage', message, this);
        }

        winston.info('Attempting to register', args.user);

        const body = await request.get(`https://www.erepublik.com/en/citizen/profile/${args.user}`);
        const $ = cheerio.load(body);

        const Citizen = this.client.databases.citizens.table;

        // Finding citizen with the provided ID in the db
        const user = await Citizen.findById(args.user);
        // If the user was found
        if (user) {
            winston.verbose('Found citizen with id', user.id);
            if ((user.verified === false && user.discord_id == message.author.id) || user.reclaiming == message.author.id) {
                const verify = this.verifyCode($, user.code);

                // If code is in the about me page
                if (verify) {
                    winston.verbose('Successfully verified code for', user.id);
                    user.verified = true;
                    user.code = null;
                    user.discord_id = message.author.id;
                    user.reclaiming = null;

                    await user.save();
                    await this._addRoles(message, user);

                    const l_verified = this.client._('command.register.verified', `**${args.user}**`);
                    const l_verified1 = this.client._('command.register.verified1');

                    const reply = await message.reply(`:white_check_mark: ${l_verified}\n ${l_verified1} :thumbsup:`);
                    this._deleteMessageAndReply(message, reply);
                } else if (verify === false) {
                    winston.warn('Code didn\'t match for', args.user);
                    // If code doesn't match
                    const reply = await message.reply(this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${user.code}]\``));
                    this._deleteMessageAndReply(message, reply);
                } else {
                    winston.warn('Code invalid for', args.user);
                    // If invalid code
                    const code = this.generateCode();
                    user.code = code;
                    user.discord_id = message.author.id;
                    await user.save();

                    const reply = await message.reply(`:arrows_counterclockwise: Something went wrong! Please add \`[tron=${code}]\` to your **About me** section and try again`);
                    this._deleteMessageAndReply(message, reply);
                }
            } else {
                const owner = this.client.util.resolveUser(user.discord_id, this.client.users);
                if (owner.id == message.author.id) {
                    const reply = await message.reply(`:white_check_mark: ${this.client._('command.register.already_verified')}!`);
                    this._deleteMessageAndReply(message, reply);
                    return;
                }

                const l_already_claimed = this.client._('command.register.already_claimed', `\`${args.user}\``, `<@${owner.id}>\n:arrows_counterclockwise: __`);
                const l_options = this.client._('bot.prompt.options', '**yes**', '**no**');

                try {
                    const prompt = await this.client.util.prompt(
                        message,
                        `${l_already_claimed}?__ (${l_options})`,
                        () => true,
                        30000,
                        {
                            reply: message.author
                        }
                    );

                    if (prompt.content.startsWith('y')) {
                        const code = this.generateCode();
                        user.reclaiming = message.author.id;
                        user.code = code;
                        await user.save();
                        const reply = await message.reply(`Ok :ok_hand:. ${this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``)}`);
                        this._deleteMessageAndReply(message, reply);
                    }
                } catch (e) {
                    if (e == 'time') {
                        await message.reply('Oops... reply time has ran out');
                    }
                }
            }
        // If the user wasnt found in the database
        } else {
            winston.verbose('Generating code for', args.user);
            const code = this.generateCode();
            await Citizen.create({
                id: args.user,
                discord_id: message.author.id,
                code: code
            });

            const l_add_code = this.client._('command.register.add_code', `**${args.user}**`, `\`[tron=${code}]\``);
            const reply = await message.reply(`:information_source: ${l_add_code}.`);
            this._deleteMessageAndReply(message, reply);
        }
    }
}

module.exports = RegisterCommand;
