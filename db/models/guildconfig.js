'use strict';
module.exports = (sequelize, DataTypes) => {
    const GuildConfig = sequelize.define('GuildConfig', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        field: {
            type: DataTypes.STRING,
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
                GuildConfig.belongsTo(models.Guild, {
                    as: 'guild_id'
                });
            }
        }
    });

    return GuildConfig;
};
