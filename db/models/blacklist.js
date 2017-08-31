'use strict';
module.exports = function(sequelize, DataTypes) {
  var Blacklist = sequelize.define('Blacklist', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    reason: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Blacklist;
};
