'use strict';
module.exports = (sequelize, DataTypes) => {
    const Guild = sequelize.define('Guild', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        prefix: {
            type: DataTypes.STRING,
            defaultValue: '!'
        },
        locale: {
            type: DataTypes.STRING,
            defaultValue: 'en'
        }
    }, {
        classMethods: {
            // associate: models => {
            // associations can be defined here
            // }
        }
    });
    return Guild;
};
