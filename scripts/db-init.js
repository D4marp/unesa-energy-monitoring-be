const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initDb() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || 'smart_energy_dashboard';

  console.log(`Connecting to MySQL server at ${dbHost}:${dbPort} as ${dbUser}...`);

  // 1. Connect without database to create it if it doesn't exist
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort
    });
    console.log('✅ Connected to MySQL server.');
  } catch (error) {
    console.error('❌ Failed to connect to MySQL server:', error.message);
    process.exit(1);
  }

  // 2. Create database using DB_NAME from env
  try {
    console.log(`Creating database "${dbName}" if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Selected database "${dbName}".`);
  } catch (error) {
    console.error('❌ Failed to create/select database:', error.message);
    await connection.end();
    process.exit(1);
  }

  // 3. Check if 'users' table already exists (to avoid duplicate initialization)
  try {
    const [tables] = await connection.query(`SHOW TABLES LIKE 'users'`);
    if (tables.length > 0) {
      console.log('ℹ️ Database already initialized (users table exists). Skipping schema migration.');
      await connection.end();
      return;
    }
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    await connection.end();
    process.exit(1);
  }

  // 4. Read and parse schema.sql
  let sqlContent;
  try {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    sqlContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Read schema.sql successfully.');
  } catch (error) {
    console.error('❌ Failed to read schema.sql:', error.message);
    await connection.end();
    process.exit(1);
  }

  // Clean SQL and extract trigger
  let cleanedSql = sqlContent
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Extract trigger block
  const triggerRegex = /CREATE\s+TRIGGER[\s\S]*?END(?=\s*\$\$|\s*;)/i;
  const triggerMatch = cleanedSql.match(triggerRegex);
  let triggerSql = '';
  if (triggerMatch) {
    triggerSql = triggerMatch[0];
    cleanedSql = cleanedSql.replace(triggerRegex, '/* TRIGGER_PLACEHOLDER */');
  }

  // Remove DB creation/use lines
  cleanedSql = cleanedSql.replace(/CREATE\s+DATABASE[\s\S]*?;/gi, '');
  cleanedSql = cleanedSql.replace(/USE\s+[\w`\-]+;/gi, '');
  cleanedSql = cleanedSql.replace(/DELIMITER[\s\S]*?$/gm, '');

  // Split into separate queries
  const queries = cleanedSql
    .split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0);

  // Restore trigger query
  const finalQueries = [];
  for (let query of queries) {
    if (query.includes('TRIGGER_PLACEHOLDER')) {
      if (triggerSql) {
        finalQueries.push(triggerSql);
      }
    } else {
      finalQueries.push(query);
    }
  }

  // 5. Execute queries one by one
  console.log(`Running ${finalQueries.length} initialization queries...`);
  for (let i = 0; i < finalQueries.length; i++) {
    const query = finalQueries[i];
    try {
      await connection.query(query);
    } catch (error) {
      console.error(`❌ Error executing query #${i + 1}:`);
      console.error(query.substring(0, 150) + '...');
      console.error(error.message);
      await connection.end();
      process.exit(1);
    }
  }

  console.log('✅ Database schema and default data initialized successfully.');
  await connection.end();
}

initDb()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
