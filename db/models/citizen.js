'use strict';
module.exports = (sequelize, DataTypes) => {
    const Citizen = sequelize.define('Citizen', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        discord_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        reclaiming: {
            type: DataTypes.STRING
        },
        code: DataTypes.STRING
    }, {
        classMethods: {
            // associate: models => {
                // associations can be defined here
            // }
        }
    });
    return Citizen;
};
