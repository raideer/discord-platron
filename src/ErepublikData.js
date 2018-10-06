const Sequelize = require('sequelize');
const moment = require('moment-timezone');
const { Collection } = require('discord.js');

class ErepublikData {
    constructor() {
        this.first_day = '2007-11-20';
        this.timezone = 'America/Los_Angeles';

        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: `${__dirname}/../ErepublikData.db`,
            operatorsAliases: false
        });

        this.Country = sequelize.define('country', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            name: Sequelize.STRING,
            code: Sequelize.STRING
        }, { timestamps: false });

        this.Industry = sequelize.define('industry', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            name: Sequelize.STRING,
            code: Sequelize.STRING
        }, { timestamps: false });

        this.Region = sequelize.define('region', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            name: Sequelize.STRING,
            original_owner_country_id: Sequelize.INTEGER,
            permalink: Sequelize.STRING,
            zone: Sequelize.INTEGER
        }, { timestamps: false });

        this.countries = new Collection();
        this.industries = new Collection();
    }

    async init() {
        const countries = await this.Country.findAll();
        for (const row of countries) {
            this.countries.set(row.id, row);
        }

        const industries = await this.Industry.findAll();
        for (const row of industries) {
            this.industries.set(row.id, row);
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

    industryCodeToId(code) {
        return this.industries.find(industry => {
            return industry.code == code;
        });
    }
}

module.exports = new ErepublikData();
