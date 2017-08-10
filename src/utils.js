const countries_json = require('./countryCodes.json');
const { Collection } = require('discord.js');
const cheerio = require('cheerio');
const request = require('request');

const countries = (() => {
    let col = new Collection();

    for (let c in countries_json) {
        col.set(c, countries_json[c]);
    }

    return col;
})();

module.exports = {
    countries: countries,
    getFlag: (countryName) => {
        let country = countries.find((c) => {
            return c.countryName.toLowerCase() == countryName.toLowerCase();
        });

        if (country) {
            return `:flag_${country.iso2.toLowerCase()}:`;
        }

        return "";
    },
    number: (number) => {
        return Number(number).toLocaleString();
    },
    strToColor: (str) => {
        function hashCode(str) {
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
               hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }

        function intToRGB(i){
            var c = (i & 0x00FFFFFF)
                .toString(16)
                .toUpperCase();

            return "00000".substring(0, 6 - c.length) + c;
        }

        return intToRGB(hashCode(str)).toLowerCase().split('').reduce( (result, ch) =>
        result * 16 + '0123456789abcdefgh'.indexOf(ch), 0);
    },
    citizenNameToId: (name) => {
        return new Promise((resolve, reject) => {
            request.get(`https://www.erepublik.com/en/main/search/?q=${encodeURIComponent(name)}`, (error, response, body) => {
                if (error) {
                    return reject(error);
                }

                const $ = cheerio.load(body);

                const results = $('table.bestof tr');

                if (results.length >= 2) {
                    const profileUrl = $(results[1]).find('.nameholder a').attr('href');
                    if (profileUrl) {
                        const match = profileUrl.match(/profile\/([0-9]+)/);
                        if (match) {
                            const id = Number(match[1]);

                            return resolve(id);
                        }
                    }
                }

                return reject();
            });
        });
    }
};
