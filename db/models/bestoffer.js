'use strict';
module.exports = (sequelize, DataTypes) => {
  var BestOffer = sequelize.define('BestOffer', {
    industry: DataTypes.INTEGER,
    quality: DataTypes.INTEGER,
    data: DataTypes.TEXT
  }, {});
  BestOffer.associate = function(models) {
    // associations can be defined here
  };
  return BestOffer;
};