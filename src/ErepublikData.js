const Sequelize = require('sequelize');
const moment = require('moment-timezone');
const { Collection } = require('discord.js');

class ErepublikData {
    constructor() {
        this.first_day = '2007-11-20';
        this.timezone = 'America/Los_Angeles';

        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: `${__dirname}/../ErepublikData.db`
        });

        this.Country = sequelize.define('country', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            name: Sequelize.STRING,
            code: Sequelize.STRING
        }, { timestamps: false });

        this.countries = new Collection();
    }

    async _initDb() {
        const rows = await this.Country.findAll();
        for (const row of rows) {
            this.countries.set(row.id, row);
        }
    }

    dayToDate(day) {
        const date = moment.tz(this.first_day, this.timezone);
        date.add(day, 'days');
        return date;
    }

    getDay() {
        const date = moment.tz(this.first_day, this.timezone);
        const now = moment();
        return now.diff(date, 'days');
    }

    countryIdToName(id) {
        if (this.countries.has(Number(id))) {
            return this.countries.get(Number(id)).name;
        }
    }
}

module.exports = new ErepublikData();
