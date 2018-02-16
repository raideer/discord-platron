const Command = require('../PlatronCommand');
const { RichEmbed } = require('discord.js');

class MarketCommand extends Command {
    constructor() {
        super('market', {
            aliases: ['bo', 'market', 'price', 'bestoffers'],
            description: () => {
                return this.client._('command.market.description');
            },
            usage: 'bo (product) [quality]',
            usageExamples: [
                'bo food 5',
                'bo wrm'
            ],
            usageNote: 'Products: `weapons`, `food`, `houses`, `aircraft`, `tickets`',
            args: [
                {
                    id: 'product',
                    type: product => {
                        const weapons = [
                            'weapon', 'weapons', 'wep', 'weps', 'guns', 'gun',
                            'w', 'tank', 'tanks'
                        ];

                        const food = [
                            'food', 'foods', 'bread', 'f'
                        ];

                        const houses = [
                            'house', 'houses', 'home', 'h'
                        ];

                        const aircraft = [
                            'aircraft', 'aircrafts', 'air', 'airplane', 'plane',
                            'rocket', 'rockets', 'missile', 'missiles', 'a'
                        ];

                        const tickets = [
                            'ticket', 'tickets', 't'
                        ];

                        if (weapons.indexOf(product) !== -1) return 'weapons';
                        if (food.indexOf(product) !== -1) return 'food';
                        if (houses.indexOf(product) !== -1) return 'houses';
                        if (aircraft.indexOf(product) !== -1) return 'aircraft';
                        if (tickets.indexOf(product) !== -1) return 'tickets';

                        return product;
                    },
                    default: null
                },
                {
                    id: 'quality',
                    type: (quality, message, args) => {
                        quality = quality.replace(/^\D+/g, '');
                        quality = Number(quality);

                        switch (args.product) {
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
        switch (quality) {
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
        switch (product) {
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
        case 'hrm':
            industry = 17; break;
        default:
            return null;
        }

        return `https://www.erepublik.net/images/icons/industry/${industry}/q${quality}.png`;
    }

    async exec(message, args) {
        if (!args.product) {
            return this.client.platron_utils.invalidCommand(message, this);
        }

        const data = await this.client.platron_utils.deutchlandApi(`market/bestoffers/${args.product}/${args.quality}`);
        let answer = '';

        const l_for = this.client._('command.market.for');
        const l_go_to_offer = this.client._('command.market.go_to_offer');
        const l_bestoffers = this.client._('command.market.best_offers');

        if (data.status == 'ok') {
            for (let i = 0; i < Math.min(5, data.bestoffers.length); i++) {
                const offer = data.bestoffers[i];
                if (args.product == 'food') {
                    var hp = this.getHpRestored(args.quality);
                    var hpcc = Math.round((offer.price / hp) * 10000) / 10000;
                    answer += `**${this.client.platron_utils.number(offer.amount)}** ${l_for} **${this.client.platron_utils.number(offer.price)} cc** (${hpcc} cc/hp) in ${this.client.platron_utils.getFlag(offer.country_name)} ${offer.country_name} | [${l_go_to_offer}](https://www.erepublik.com/en/economy/marketplace/offer/${offer.offer_id})\n`;
                } else {
                    answer += `**${this.client.platron_utils.number(offer.amount)}** ${l_for} **${this.client.platron_utils.number(offer.price)} cc** in ${this.client.platron_utils.getFlag(offer.country_name)} ${offer.country_name} | [${l_go_to_offer}](https://www.erepublik.com/en/economy/marketplace/offer/${offer.offer_id}) \n`;
                }
            }

            const embed = new RichEmbed()
            .setTitle(`${l_bestoffers} ${args.product} Q${args.quality}`)
            .setThumbnail(this.getIcon(args.product, args.quality))
            .setColor(2551405)
            .setDescription(answer);

            message.channel.send({ embed });
        } else {
            switch (data.message) {
            case 'E_INVALID_ITEM_QUALITY_COMBINATION':
                answer = this.client._('command.market.invalid_combination');
                break;
            case 'E_INVALID_ITEM':
                answer = this.client._('command.market.invalid_product');
                break;
            default:
                answer = data.message;
                break;
            }

            message.reply(answer);
        }
    }
}

module.exports = MarketCommand;
