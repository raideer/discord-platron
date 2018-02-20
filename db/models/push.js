'use strict';
module.exports = (sequelize, DataTypes) => {
    const Push = sequelize.define('Push', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        }
    }, {
        classMethods: {
            // associate: models => {
            // associations can be defined here
            // }
        }
    });
    return Push;
};
