import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize or migrate the database with the full schema
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {Database} - The initialized database instance
 */
export function initializeDatabase(dbPath) {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split schema into individual statements and execute
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`Executing ${statements.length} schema statements...`);

  // Execute in a transaction for better performance
  db.transaction(() => {
    for (const statement of statements) {
      try {
        db.prepare(statement + ';').run();
      } catch (err) {
        // Ignore errors for CREATE IF NOT EXISTS and similar
        if (!err.message.includes('already exists')) {
          console.warn(`Warning executing statement: ${err.message}`);
        }
      }
    }
  })();

  console.log('Database schema initialized successfully!');

  // Print table summary
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log(`\nDatabase contains ${tables.length} tables:`);
  tables.forEach(({ name }) => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
    console.log(`  - ${name}: ${count.count} rows`);
  });

  return db;
}

/**
 * Standalone script execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db.sqlite');
  console.log(`Initializing database at: ${dbPath}\n`);

  try {
    initializeDatabase(dbPath);
    console.log('\nDatabase initialization complete!');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}
