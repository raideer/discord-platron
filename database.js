const Sequelize = require('sequelize');
const seq = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
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

const Citizens = seq.define('citizens', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    erep_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    avatar: {
        type: Sequelize.STRING
    },
    varified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: seq,
    Guild: Guild,
    Blacklist: Blacklist,
    Citizens: Citizens
};
