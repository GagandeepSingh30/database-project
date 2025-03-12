module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('computer', 'printer', 'phone', 'network', 'server', 'other'),
      allowNull: false
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    warrantyExpiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'maintenance', 'retired']]
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  Equipment.associate = (models) => {
    // Equipment belongs to an Office
    Equipment.belongsTo(models.Office, {
      foreignKey: {
        name: 'officeId',
        allowNull: false
      }
    });

    // Equipment can be referenced in many Tickets
    Equipment.hasMany(models.Ticket, {
      foreignKey: 'equipmentId'
    });
  };

  return Equipment;
}; 