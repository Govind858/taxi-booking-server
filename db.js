const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // needed for hosted DBs with SSL
});

module.exports = pool;




// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'sancharidb',
//   password: '1234',
//   port: 5432,
// });