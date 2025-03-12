const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'helpdesk',
      validate: {
        isIn: [['helpdesk', 'technician', 'manager']]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.associate = (models) => {
    // A User belongs to an Office
    User.belongsTo(models.Office, {
      foreignKey: {
        name: 'officeId',
        allowNull: true
      }
    });

    // A User can create many Tickets
    User.hasMany(models.Ticket, {
      foreignKey: 'createdBy',
      as: 'createdTickets'
    });

    // A User (technician) can be assigned to many Tickets
    User.hasMany(models.Ticket, {
      foreignKey: 'assignedTo',
      as: 'assignedTickets'
    });
  };

  // Instance method to check if user is helpdesk operator
  User.prototype.isHelpdesk = function() {
    return this.role === 'helpdesk';
  };

  // Instance method to check if user is technician
  User.prototype.isTechnician = function() {
    return this.role === 'technician';
  };

  // Instance method to check if user is manager
  User.prototype.isManager = function() {
    return this.role === 'manager';
  };

  // Instance method to get full name
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  return User;
}; 