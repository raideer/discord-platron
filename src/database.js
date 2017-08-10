const Sequelize = require('sequelize');
const seq = new Sequelize({
    dialect: 'sqlite',
    storage: __dirname + '/../database.sqlite',
    logging: false
});

const Guild = seq.define('guilds', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    prefix: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    locale: {
        type: Sequelize.STRING,
        defaultValue: 'en'
    }
});

const Blacklist = seq.define('blacklist', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    reason: {
        type: Sequelize.STRING
    }
});

const Citizen = seq.define('citizens', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    discord_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    avatar: {
        type: Sequelize.STRING
    },
    verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    reclaiming: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    code: {
        type: Sequelize.STRING
    }
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: seq,
    Guild: Guild,
    Blacklist: Blacklist,
    Citizen: Citizen
};
