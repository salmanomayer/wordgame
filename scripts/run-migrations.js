#!/usr/bin/env node

/**
 * Run SQL migration scripts on Windows without psql in PATH
 * Usage: node scripts/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get database connection from environment variables
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING ||
  'postgresql://postgres:12345678@localhost:5432/wordgame';

const pool = new Pool({ connectionString });

// List of migration scripts in order
const migrationScripts = [
  '001_create_tables.sql',
  '002_seed_demo_data.sql',
  '004_seed_admin_users.sql',
  '005_add_roles_and_permissions.sql',
  '006_update_admin_password.sql',
  '007_add_level_system.sql',
  '009_remove_difficulty_from_subjects.sql',
  '010_add_leaderboard_features.sql',
  '011_cleanup_old_records.sql',
  '012_add_player_name_field.sql',
  '013_add_player_status.sql',
  '014_add_password_reset_tokens.sql',
  '015_add_player_logs.sql',
  '016_add_games_and_stages.sql',
  '017_add_word_count_to_games.sql',
  '017_seed_core_data.sql',
];

async function runMigration(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️  Skipping ${scriptName} (file not found)`);
    return;
  }

  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  try {
    console.log(`📄 Running ${scriptName}...`);
    await pool.query(sql);
    console.log(`✅ Completed ${scriptName}`);
  } catch (error) {
    // Some errors are expected (like "already exists" or "column already exists")
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('duplicate key') ||
        error.message.includes('ON CONFLICT')) {
      console.log(`⚠️  ${scriptName} - ${error.message.split('\n')[0]}`);
    } else {
      console.error(`❌ Error in ${scriptName}:`);
      console.error(error.message);
      throw error;
    }
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting database migrations...\n');
  console.log(`📊 Database: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);

  const client = await pool.connect();
  
  try {
    // Test connection
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Run migrations in order
    for (const script of migrationScripts) {
      await runMigration(script);
    }

    console.log('\n✨ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.position) {
      const pos = parseInt(error.position, 10);
      const lines = sql.slice(0, pos).split('\n');
      const lineNumber = lines.length;
      const lineText = lines[lineNumber - 1].trim();

      lineInfo = ` (at line ${lineNumber}: "${lineText}")`;
    }

    console.error(`❌ Error in ${scriptName}:${lineInfo}`);
    console.error(message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runAllMigrations().catch(console.error);
