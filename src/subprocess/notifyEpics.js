require('dotenv').config({
    path: __dirname + '/../../.env'
});

const request = require('request-promise');
const moment = require('moment-timezone');
const winston = require('winston');
const { CronJob, CronTime} = require('cron');
const { Push } = require('../../db/models/index');

const campaignsURI = 'https://www.erepublik.com/en/military/campaigns-new';

const CRON_EVERY_5MINUTES = '*/5 * * * *';
const CRON_EVERY_30SECONDS = '*/30 * * * * *';
const TIME_ZONE = 'America/Los_Angeles';

const C = {
    BATTLE_TYPE: {
        EPIC: 2,
        FULL_SCALE: 1,
        COLD: 0
    }
};

let activeTab = CRON_EVERY_30SECONDS;
let isFSorEpic = false;

let cron = new CronJob({
    cronTime: activeTab,
    onTick: checkForEpics,
    start: false,
    timeZone: TIME_ZONE,
    runOnInit: false
});

function getTimeLeft(battle, getDiv = null) {
    // eRepublik only returns 7 digit unix timestamp, so we're extending to 9
    const battleStart = moment.tz(battle.start * 1000, TIME_ZONE);
    const now = moment();

    const battleTime = now.diff(battleStart, 'minutes');
    const invaderId = battle.inv.id;
    const times = {};

    function getDivTimeLeft(div) {
        let winnerDomination = div.wall.for == invaderId ? div.dom_pts.inv : div.dom_pts.def;

        for (let i = battleTime; i <= 120; i++) {
            if (i > 90) {
                winnerDomination += 60;
            } else if (i > 60) {
                winnerDomination += 30;
            } else if (i > 30) {
                winnerDomination += 20
            } else {
                winnerDomination += 10;
            }

            if (winnerDomination >= 1800) {
                return 1 + (i - battleTime);
            }
        }

        return 1;
    }

    if (getDiv) {
        return getDivTimeLeft(battle.div[getDiv]);
    }

    for(let div in battle.div) {
        const division = battle.div[div];
        const time = getDivTimeLeft(division);
        times[div] = time;
    }

    return times;
}

function getEpicsAndFS(battles) {
    const data = {
        epic: [],
        fs: []
    };

    for (let battleId in battles) {
        const battle = battles[battleId];

        for (let division in battle.div) {
            const div = battle.div[division];

            if (getTimeLeft(battle, division) < 1) continue;

            if (div.epic === C.BATTLE_TYPE.EPIC) {
                data.epic.push(battle);
            } else if (div.epic === C.BATTLE_TYPE.FULL_SCALE) {
                data.fs.push(battle);
            }
        }
    }

    return data;
}

function announceEpics(epicBattle) {
    const divisionTimes = getTimeLeft(epicBattle);
    for (let i in epicBattle.div) {
        const division = epicBattle.div[i];
        if (division.epic !== C.BATTLE_TYPE.EPIC) continue;

        const timeLeft = divisionTimes[i];
        if (timeLeft < 1) continue;
        const epicId = `i${epicBattle.id}z${epicBattle.zone_id}d${i}`;

        Push.findOrCreate({
            where: { id: epicId },
            defaults: { id: epicId }
        })
        .spread((p, created) => {
            console.log(created);
            if (!created) return;

            const payload = {
                div: i,
                timeLeft,
                battle: epicBattle,
                id: epicId
            };
    
            console.log(payload);
            if (process.send) {
                return process.send(payload);
            }
        });
    }
}

async function checkForEpics() {
    console.log('Checking for epics');

    const activeBattles = await request(campaignsURI, {
        json: true
    });

    const eligibleBattles = getEpicsAndFS(activeBattles.battles);
    const eligibeCount = eligibleBattles.epic.length + eligibleBattles.fs.length;

    // If there are eligible battles, set cron to 30 sec intervals
    if (eligibeCount > 0) {
        if (activeTab !== CRON_EVERY_30SECONDS) {
            console.log('Found eligible battles. Decreasing cron interval');
            cron.setTime(new CronTime(CRON_EVERY_30SECONDS));
            activeTab = CRON_EVERY_30SECONDS;
        }

        console.log('Found', eligibeCount, 'eligible battles');
        console.log('Found', eligibleBattles.epic.length, 'EPIC battles');

        eligibleBattles.epic.forEach(epicBattle => {
            announceEpics(epicBattle);
        });
    } else {
        if (activeTab !== CRON_EVERY_5MINUTES) {
            console.log('No active battles. Increasing cron interval');
            cron.setTime(new CronTime(CRON_EVERY_5MINUTES));
            activeTab = CRON_EVERY_5MINUTES;
        }
    }

    if (!cron.running) cron.start();
}

Push.sync().then(() => {
    console.log('Starting the cronjob');
    checkForEpics();
});
