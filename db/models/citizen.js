'use strict';
module.exports = function(sequelize, DataTypes) {
  var Citizen = sequelize.define('Citizen', {
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
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    code: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Citizen;
};
