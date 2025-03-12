module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, only visible to staff, not to regular users'
    }
  });

  Comment.associate = (models) => {
    // A Comment belongs to a Ticket
    Comment.belongsTo(models.Ticket, {
      foreignKey: {
        name: 'ticketId',
        allowNull: false
      }
    });

    // A Comment belongs to a User who created it
    Comment.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      }
    });
  };

  return Comment;
}; 