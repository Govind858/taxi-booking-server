const { Pool } = require('pg');
require('dotenv').config();


// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'sancharidb',
//   password: '1234',
//   port: 5432,
// });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

module.exports = pool;