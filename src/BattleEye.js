const winston = require('winston');
const request = require('request-promise');
const crypto = require('crypto');
const cheerio = require('cheerio');

class BattleEye {
    async loadStats(battleId, round = 1) {
        const leftData = new Map();
        const rightData = new Map();
        let leftId = null;
        let rightId = null;

        const divs = round % 4 === 0 ? [11] : [1, 2, 3, 4];

        const collectStats = async (div, type) => {
            let page = 1;
            let maxPage = 1;
            do {
                const stats = await this.getStats(battleId, div, round, page, page, type);
                delete stats.rounds;
                const countries = Object.keys(stats);
                if (!leftId) leftId = countries[0];
                if (!rightId) rightId = countries[1];

                for (const i in stats[leftId].fighterData) {
                    const data = leftData.get(div);
                    data[type].push(stats[leftId].fighterData[i]);
                    leftData.set(div, data);
                }

                for (const i in stats[rightId].fighterData) {
                    const data = rightData.get(div);
                    data[type].push(stats[rightId].fighterData[i]);
                    rightData.set(div, data);
                }

                maxPage = Math.max(stats[leftId].pages, stats[rightId].pages);

                winston.info(`Processed ${type} for division ${div} round ${round} | ${page}/${maxPage}`);
                page++;
            } while (page <= maxPage);
        };

        const promises = [];

        for (const division of divs) {
            leftData.set(division, { kills: [], damage: [] });
            rightData.set(division, { kills: [], damage: [] });
            promises.push(collectStats(division, 'damage'));
            promises.push(collectStats(division, 'kills'));
        }

        await Promise.all(promises);
        return {
            left: leftData,
            right: rightData,
            leftId, rightId
        };
    }

    async getNbpStats(battleId, division) {
        const data = await request({
            uri: `https://www.erepublik.com/en/military/nbp-stats/${battleId}/${division}`,
            json: true
        });
        winston.verbose('Retrieved nbp stats');
        return data;
    }

    async getStats(battleId, division, round, pageLeft, pageRight, type = 'damage') {
        const body = await request({
            method: 'POST',
            uri: 'https://www.erepublik.com/en/military/battle-console',
            form: {
                _token: this.csrf,
                action: 'battleStatistics',
                battleId: battleId,
                division: division,
                leftPage: pageLeft,
                rightPage: pageRight,
                round: round,
                type: type,
                zoneId: parseInt(round, 10)
            },
            jar: this.jar,
            json: true
        });

        return body;
    }

    _token() {
        return crypto.createHash('md5').update(String(Date.now())).digest('hex');
    }

    async authenticate() {
        winston.info('Attempting to login to eRepublik');
        this.jar = request.jar();
        const token = this._token();
        const body = await request({
            method: 'POST',
            uri: 'https://www.erepublik.com/en/login',
            form: {
                _token: token,
                citizen_email: process.env.BE_U,
                citizen_password: process.env.BE_P,
                remember: 'on'
            },
            headers: {
                Referer: 'https://www.erepublik.com/en',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0'
            },
            jar: this.jar,
            followAllRedirects: true
        });

        const $ = cheerio.load(body);
        this.csrf = $('#_token').val();
        winston.info('Sucessfully logged in');
    }
}

module.exports = new BattleEye();
