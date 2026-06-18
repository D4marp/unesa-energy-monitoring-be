const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_energy_dashboard',
  port: process.env.DB_PORT || 3030,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

// Export pool with a query helper
pool.query = function(sql, values) {
  return pool.getConnection()
    .then(connection => {
      return connection.query(sql, values)
        .then(results => {
          connection.release();
          return results;
        })
        .catch(err => {
          connection.release();
          throw err;
        });
    });
};

module.exports = pool;
