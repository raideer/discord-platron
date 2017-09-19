'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Roles', {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            key: {
                type: Sequelize.STRING,
                allowNull: false
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
        return queryInterface.dropTable('Roles');
    }
};
