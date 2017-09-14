'use strict';
module.exports = (sequelize, DataTypes) => {
    const GuildConfig = sequelize.define('GuildConfig', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: 'comp'
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'comp'
        },
        value: DataTypes.STRING
    }, {
        classMethods: {
            associate: models => {
                GuildConfig.belongsTo(models.Guild);
            }
        }
    });

    return GuildConfig;
};
