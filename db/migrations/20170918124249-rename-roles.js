'use strict';

module.exports = {
    up: async queryInterface => {
        await queryInterface.renameColumn('Roles', 'type', 'name');
        await queryInterface.renameColumn('Roles', 'key', 'group');
    },
    down: async queryInterface => {
        await queryInterface.renameColumn('Roles', 'name', 'type');
        await queryInterface.renameColumn('Roles', 'group', 'key');
    }
};
