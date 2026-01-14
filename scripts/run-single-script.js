#!/usr/bin/env node

/**
 * Run a single SQL script
 * Usage: node scripts/run-single-script.js <script-name>
 * Example: node scripts/run-single-script.js 017_seed_core_data.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const scriptName = process.argv[2];

if (!scriptName) {
  console.error('❌ Please provide a script name');
  console.log('Usage: node scripts/run-single-script.js <script-name>');
  console.log('Example: node scripts/run-single-script.js 017_seed_core_data.sql');
  process.exit(1);
}

// Get database connection from environment variables
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING ||
  'postgresql://postgres:12345678@localhost:5432/wordgame';

const pool = new Pool({ connectionString });

async function runScript() {
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script not found: ${scriptPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  try {
    console.log(`📄 Running ${scriptName}...`);
    console.log(`📊 Database: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);
    
    const result = await pool.query(sql);
    console.log(`✅ Script executed successfully!`);
    if (result.rowCount !== undefined) {
      console.log(`📊 Rows affected: ${result.rowCount}`);
    }
  } catch (error) {
    console.error(`❌ Error running script:`);
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runScript();
