module.exports = (sequelize, DataTypes) => {
  const Office = sequelize.define('Office', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Office.associate = (models) => {
    // An Office has many Users
    Office.hasMany(models.User, {
      foreignKey: 'officeId'
    });

    // An Office has many Equipment
    Office.hasMany(models.Equipment, {
      foreignKey: 'officeId'
    });
  };

  return Office;
}; 