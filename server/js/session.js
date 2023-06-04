const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize'); // Adjust the path based on your setup

const Session = sequelize.define('Sessions', {
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nfts: {
    type: DataTypes.STRING(1500),
    allowNull: true,
    get() {
      const value = this.getDataValue('nfts');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('nfts', value ? JSON.stringify(value) : null);
    },
  },
}, {
  tableName: 'Sessions',
});

module.exports = Session;
