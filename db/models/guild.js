'use strict';
module.exports = function(sequelize, DataTypes) {
  var Guild = sequelize.define('Guild', {
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
    },
    roleVerified: DataTypes.STRING,
    roleVerifiedEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    forceErepNames: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Guild;
};
