require('dotenv').config({
    path: '../../.env'
});

const request = require('request-promise');
const moment = require('moment');
const uu = require('url-unshort')();
const winston = require('winston');
const CronJob = require('cron').CronJob;
const { Push } = require('../../db/models/index');

const MAX_PUSH_AGE = 90;

async function checkForEpics() {
    winston.info('Getting latest pushes');
    const response = await getLatestPushes(10);
    if (!response.pushes) {
        winston.warn('No pushes received');
        return;
    }

    winston.info('Received', response.pushes.length, 'pushes');

    const pushes = response.pushes
    .filter(push => {
        // Filtering old pushes
        const pushTime = moment.unix(push.created);
        const timeDiffSeconds = pushTime.diff(moment.now(), 'seconds');
        return timeDiffSeconds >= -MAX_PUSH_AGE;
    });

    for (let i = 0; i < pushes.length; i++) {
        const push = pushes[i];
        // eslint-disable-next-line
        await Push.findOrCreate({
            where: { id: push.iden },
            defaults: { id: push.iden }
        })
        .spread((p, created) => {
            winston.info('Processing push', push.iden);
            // Already notified
            if (!created) return;

            const pushBody = getPushBody(push);
            // Check if valid body
            if (!pushBody) {
                winston.warn('Invalid push body', push);
                return;
            }

            const [_text, division, region, url, time] = pushBody;
            winston.info('Notifying', push.iden);
            notify(division, region, url, time);
        });
    }
}

async function getLatestPushes(num = 5) {
    const data = await request({
        method: 'GET',
        json: true,
        uri: `https://api.pushbullet.com/v2/pushes?limit=${num}`,
        headers: {
            'Access-Token': process.env.PUSHBULLET_API_KEY
        }
    });

    return data;
}

function getPushBody(push) {
    const str = `${push.title} - ${push.body}`;
    const regex = new RegExp('Division ([1-4]) - Region: (.+?) - Battlefield: ([^ ]+) *- Timeleft: ([0-9]+) min');
    return str.match(regex);
}

async function getBattleUrl(url) {
    let link = '';
    try {
        link = await uu.expand(url);
        if (!link) link = url;
    } catch (e) {
        link = url;
    }

    return link;
}

function getBattleIdFromUrl(url) {
    const regex = new RegExp('/([0-9]+)$');
    const match = url.match(regex);
    if (match) {
        return match[1];
    }

    return null;
}

async function getBattleDetails(battleId) {
    const data = await request({
        method: 'GET',
        json: true,
        uri: `https://api.erepublik-deutschland.de/${process.env.EREP_API}/battles/details/${battleId}`
    });

    if (data.status != 'ok') return null;
    return data.details[Object.keys(data.details)[0]];
}

async function notify(division, region, shortUrl, time) {
    const url = await getBattleUrl(shortUrl);
    const battleId = getBattleIdFromUrl(url);
    const details = await getBattleDetails(battleId);

    const payload = {
        division,
        region,
        time,
        url,
        details
    };

    if (process.send) {
        return process.send(payload);
    }

    winston.warn('Could not send payload');
}

Push.sync().then(() => {
    const _c = new CronJob(process.env.EPIC_NOTIFICATOR_CRON ? process.env.EPIC_NOTIFICATOR_CRON : '* * * * *', () => {
        checkForEpics();
    }, null, true, null);
});
// console.log(process.env);

