require('dotenv').config({
    path: __dirname + '/../../.env'
});

const request = require('request-promise');
const ErepublikData = require('../ErepublikData');
const { BestOffer } = require('../../db/models/index');

async function callApi(query) {
    if (process.send) {
        return process.send({
            done: false,
            msg: `http://${process.env.API_IP}:${process.env.API_PORT}${process.env.API_SUFFIX}${query}.json`
        });
    }

    const body = await request({
        uri: `http://${process.env.API_IP}:${process.env.API_PORT}${process.env.API_SUFFIX}${query}.json`,
        json: true
    });

    return body;
}

function getQualities(industry) {
    switch (industry) {
        case 'food':
        case 'weapons':
            return [1, 2, 3, 4, 5, 6, 7];
        case 'tickets':
        case 'houses':
            return [1, 2, 3, 4, 5];
        default:
            return [1];
    }
}

async function update() {
    await ErepublikData._initDb();
    await BestOffer.sync();

    const industries = ErepublikData.industries.map(industry => {
        return {
            id: industry.id,
            code: industry.code
        };
    });

    for (let i of industries) {
        for (let quality of getQualities(i.code)) {
            const data = await callApi(`market/bestoffers/${i.id}/${quality}.json`);

            if (!data || typeof data !== 'object') {
                await BestOffer.findOrCreate({
                    where: { industry: i.id, quality },
                    defaults: {
                        industry: i.id,
                        quality,
                        data: JSON.stringify(data)
                    }
                }).spread((offer, created) => {
                    if (created) return;

                    offer.data = JSON.stringify(data);

                    return offer.save();
                });
            }
        }
    }
}

try {
    update().then(() => {
        if (process.send) {
            return process.send({
                done: true
            });
        }
    });
} catch(e) {
    if (process.send) {
        return process.send({
            done: false,
            msg: e
        });
    }
}
