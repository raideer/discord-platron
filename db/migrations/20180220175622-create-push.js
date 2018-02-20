'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Pushes', {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
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
        return queryInterface.dropTable('Pushes');
    }
};
