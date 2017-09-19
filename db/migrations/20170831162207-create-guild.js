'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Guilds', {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            prefix: {
                type: Sequelize.STRING,
                defaultValue: '!'
            },
            locale: {
                type: Sequelize.STRING,
                defaultValue: 'en'
            },
            roleVerified: {
                type: Sequelize.STRING
            },
            roleVerifiedEnabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            forceErepNames: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
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
        return queryInterface.dropTable('Guilds');
    }
};
