'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('GuildConfigs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            field: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: 'comp'
            },
            guild_id: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: 'comp'
            },
            value: Sequelize.STRING,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: queryInterface => {
        return queryInterface.dropTable('GuildConfigs');
    }
};
