
module.exports = {
    dialect: 'mysql',
    host: 'localhost',
    username: 'loopquest',
    password: 'wMGAGP4H3KT9Spo',
    database: 'loopquest-game',
    dialect: 'mysql',
    dialectOptions: {
      socketPath: '/var/run/mysqld/mysqld.sock'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
      }
};


  