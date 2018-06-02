require('dotenv').config({
    path: __dirname + '/../../.env'
});

const request = require('request');
const ErepublikData = require('../ErepublikData');
const { BestOffer } = require('../../db/models/index');

function send(data) {
    if (process.send) {
        return process.send(data);
    }
}

async function callApi(query) {
    const endpoint = `http://${process.env.API_IP}:${process.env.API_PORT}${process.env.API_SUFFIX}${query}.json`;

    return new Promise((resolve, reject) => {
        request({
            uri: endpoint,
            json: true
        }, function(error, response, body) {
            if (error) return reject(error);

            resolve(body);
        });
    });
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

            if (data && typeof data === 'object') {
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
        send({
            done: true
        });
    });
} catch(e) {
    send({
        done: false,
        error: true,
        msg: e
    });
}
