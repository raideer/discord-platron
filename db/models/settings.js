'use strict';
module.exports = (sequelize, DataTypes) => {
  var Settings = sequelize.define('Settings', {
    name: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    data: DataTypes.TEXT
  }, {});
  Settings.associate = function(models) {
    // associations can be defined here
  };
  return Settings;
};