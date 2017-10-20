const countries_json = require('./countryCodes.json');
const { Collection } = require('discord.js');
const cheerio = require('cheerio');
const request = require('request-promise');

const countries = (() => {
    const col = new Collection();

    for (const c in countries_json) {
        col.set(c, countries_json[c]);
    }

    return col;
})();

module.exports = {
    // List of countries
    countries: countries,
    /**
     * Converts an object to a discord.js Collection
     * @param  {Object} object Object to convert
     * @returns {Collection}
     */
    objectToCollection: object => {
        const col = new Collection();
        for (const id in object) {
            col.set(id, object[id]);
        }
        return col;
    },
    /**
     * Returns an emoji flag of the given country
     * @param  {string} countryName Country
     * @returns {string}
     */
    getFlag: countryName => {
        const country = countries.find(c => {
            return c.countryName.toLowerCase() == countryName.toLowerCase();
        });

        if (country) {
            return `:flag_${country.iso2.toLowerCase()}:`;
        }

        return '';
    },
    /**
     * Converts a number to a localized number string
     * eg. 100000 will convert to 100'000
     * @param  {number/string} number Number to convert
     * @returns {string} Localized number string
     */
    number: number => {
        return Number(number).toLocaleString();
    },
    /**
     * Converts any string to a color
     * Two identical strings will return the same color
     * @param  {string} str Any string
     * @returns {string/hexcolor}
     */
    strToColor: str => {
        const hashCode = s => {
            let hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = s.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        };

        const intToRGB = i => {
            var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
            return '00000'.substring(0, 6 - c.length) + c;
        };

        if (!str || str == '') {
            return 'ffffff';
        }

        return intToRGB(hashCode(str)).toLowerCase().split('')
        .reduce((result, ch) => (result * 16) + '0123456789abcdefgh'.indexOf(ch), 0);
    },
    /**
     * Scrapes basic citizen information
     * **Under construction**
     * @param  {integer}  id  ID of the citizen
     * @returns {Promise}
     */
    getCitizenInfo: async id => {
        const body = await request.get(`https://www.erepublik.com/en/citizen/profile/${id}`);
        const $ = cheerio.load(body);
        const data = {};
        const $ca = $('.citizen_activity').children();

        const prettify = text => {
            return String(text).replace(/[\t\n\r]/g, '').replace(/\s+/g, ' ').trim();
        };

        data.party = prettify($ca.first().find('.noborder span a').text());
        data.partyRole = prettify($ca.first().find('h3').text());

        return data;
    },
    /**
     * Converts citizen name to ID
     * @param  {string}  name Citizen name
     * @returns {Promise} Promise with the citizen id as a parameter
     */
    citizenNameToId: async name => {
        const body = await request.get(`https://www.erepublik.com/en/main/search/?q=${encodeURIComponent(name)}`);
        const $ = cheerio.load(body);

        const results = $('table.bestof tr');

        if (results.length >= 2) {
            const profileUrl = $(results[1]).find('.nameholder a').attr('href');
            if (profileUrl) {
                const match = profileUrl.match(/profile\/([0-9]+)/);
                if (match) {
                    const id = Number(match[1]);

                    return id;
                }
            }
        }
    }
};
