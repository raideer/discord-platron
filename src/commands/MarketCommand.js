const { Command } = require('discord-akairo');
const { getFlag, number } = require('../utils');
const request = require('request');
const { RichEmbed } = require('discord.js');

class MarketCommand extends Command {
    constructor() {
        super('market', {
            aliases: ['bo', 'market', 'price', 'bestoffers'],
            args: [
                {
                    id: 'product',
                    type: (product) => {
                        switch (product) {
                            case "weapon":
                            case "weapons":
                            case "wep":
                            case "guns":
                            case "gun":
                                product = 'weapons';
                                break;
                            case "food":
                            case "foods":
                            case "bread":
                                product = "food";
                                break;
                            case "house":
                            case "houses":
                            case "home":
                                product = "houses";
                                break;
                            case "aircraft":
                            case "aircrafts":
                            case "air":
                            case "rocket":
                            case "rockets":
                                product = "aircraft";
                                break;
                            case "ticket":
                            case "tickets":
                                product = "tickets";
                                break;
                        }

                        return product;
                    },
                    default: null
                },
                {
                    id: 'quality',
                    type: (quality, message, args) => {
                        quality = quality.replace( /^\D+/g, '');
                        quality = Number(quality);

                        switch(args.product) {
                            case 'food':
                            case 'weapons':
                                if (quality > 0 && quality <= 7) {
                                    return quality;
                                }
                                break;
                            case 'tickets':
                            case 'houses':
                                if (quality > 0 && quality <= 5) {
                                    return quality;
                                }
                                break;
                        }

                        return 1;
                    },
                    default: 1
                }
            ]
        });
    }

    getHpRestored(quality) {
        switch(quality) {
            case 1:
                return 2;
            case 2:
                return 4;
            case 3:
                return 6;
            case 4:
                return 8;
            case 5:
                return 10;
            case 6:
                return 12;
            case 7:
                return 20;
            default:
                return 0;
        }
    }

    getIcon(product, quality = 'default') {
        let industry = 1;
        switch(product) {
            case 'food':
                industry = 1; break;
            case 'weapons':
                industry = 2; break;
            case 'aircraft':
                industry = 23; break;
            case 'tickets':
                industry = 3; break;
            case 'houses':
                industry = 4; break;
            case 'frm':
                industry = 7; break;
            case 'wrm':
                industry = 12; break;
            case 'arm':
                industry = 24; break;
            case "hrm":
                industry = 17; break;
            default:
                return null;
        }

        return `https://www.erepublik.net/images/icons/industry/${industry}/q${quality}.png`;
    }

    exec(message, args) {
        const apiKey = this.client.env('EREP_API', () => {
            throw "eRepublik Deutchland API key is not set!";
        });

        if (!args.product) {
            return message.reply("Invalid command usage");
        }

        request
            .get(`https://api.erepublik-deutschland.de/${apiKey}/market/bestoffers/${args.product}/${args.quality}`, (error, response, body) => {
                if (error) {
                    return message.reply('There was a problem while processing this request');
                }

                let data = JSON.parse(body);
                let answer = '';

                if (data.status == 'ok') {
                    for (let i = 0; i < Math.min(5, data.bestoffers.length); i++) {
                        let offer = data.bestoffers[i];
                        if(args.product == 'food'){
                            var hp = this.getHpRestored(args.quality);
                            var hpcc = Math.round((offer.price/hp)*10000)/10000;
                            answer += `**${number(offer.amount)}** for **${number(offer.price)} cc** (${hpcc} cc/hp) in ${getFlag(offer.country_name)} ${offer.country_name} | [Go to offer](https://www.erepublik.com/en/economy/marketplace/offer/${offer.offer_id})\n`;
                        }else{
                            answer += `**${number(offer.amount)}** for **${number(offer.price)} cc** in ${getFlag(offer.country_name)} ${offer.country_name} | [Go to offer](https://www.erepublik.com/en/economy/marketplace/offer/${offer.offer_id}) \n`;
                        }
                    }

                    message.channel.send({embed: new RichEmbed()
                        .setTitle(`Best offers for ${args.product} Q${args.quality}`)
                        .setThumbnail(this.getIcon(args.product, args.quality))
                        .setColor(2551405)
                        .setDescription(answer)
                    });
                } else {
                    switch(data.message){
                        case 'E_INVALID_ITEM_QUALITY_COMBINATION':
                            answer = 'Invalid product and quality combination';
                            break;
                        case 'E_INVALID_ITEM':
                            answer = 'Invalid product name';
                            break;
                        default:
                            answer = data.message;
                            break;
                    }

                    message.reply(answer);
                }
            })
            ;
    }
}

module.exports = MarketCommand;
