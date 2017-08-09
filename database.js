const Sequelize = require('sequelize');
const seq = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const Guild = seq.define('guilds', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    prefix: {
        type: Sequelize.STRING,
        defaultValue: ''
    }
});

const Blacklist = seq.define('blacklist', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    reason: {
        type: Sequelize.STRING
    }
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: seq,
    Guild: Guild,
    Blacklist: Blacklist
};
