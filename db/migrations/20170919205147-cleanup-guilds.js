'use strict';

module.exports = {
    up: async queryInterface => {
        await queryInterface.removeColumn('Guilds', 'roleVerified');
        await queryInterface.removeColumn('Guilds', 'roleVerifiedEnabled');
        await queryInterface.removeColumn('Guilds', 'forceErepNames');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Guilds', 'roleVerified', {
            type: Sequelize.STRING
        });
        await queryInterface.removeColumn('Guilds', 'roleVerifiedEnabled', {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        });
        await queryInterface.removeColumn('Guilds', 'forceErepNames', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        });
    }
};
