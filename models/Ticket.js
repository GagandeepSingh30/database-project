module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
      validate: {
        isIn: [['open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed']]
      }
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  Ticket.associate = (models) => {
    // A Ticket belongs to a User who created it
    Ticket.belongsTo(models.User, {
      foreignKey: {
        name: 'createdBy',
        allowNull: false
      },
      as: 'creator'
    });

    // A Ticket can be assigned to a User (technician)
    Ticket.belongsTo(models.User, {
      foreignKey: {
        name: 'assignedTo',
        allowNull: true
      },
      as: 'assignee'
    });

    // A Ticket can be related to a specific Equipment
    Ticket.belongsTo(models.Equipment, {
      foreignKey: {
        name: 'equipmentId',
        allowNull: true
      }
    });

    // A Ticket can have many Comments
    Ticket.hasMany(models.Comment, {
      foreignKey: 'ticketId'
    });
  };

  return Ticket;
}; 