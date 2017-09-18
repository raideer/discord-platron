'use strict';
module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'guild-name'
        },
        group: {
            type: DataTypes.STRING,
            allowNull: false
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'guild-name'
        }
    }, {
        classMethods: {
            associate: models => {
                Role.belongsTo(models.Guild);
            }
        }
    });

    return Role;
};
