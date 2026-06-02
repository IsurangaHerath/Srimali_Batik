/**
 * Database Module — SQLite (local-only)
 * Auto-creates the database file at data/srimali.db on first run.
 * No environment variables or cloud services required.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'srimali.db');

let db = null;

/**
 * Get or create the SQLite database connection (singleton)
 */
function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        // Enable WAL mode for better performance
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

/**
 * Initialize all database tables.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 */
function initializeDatabase() {
    const database = getDb();

    // Patterns table
    database.exec(`
        CREATE TABLE IF NOT EXISTS patterns (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT DEFAULT '',
            image       TEXT DEFAULT '',
            colors      TEXT DEFAULT '[]',
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        )
    `);

    // Products table
    database.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id          TEXT PRIMARY KEY,
            pattern_id  TEXT REFERENCES patterns(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            type        TEXT DEFAULT '',
            description TEXT DEFAULT '',
            image       TEXT DEFAULT '',
            price       TEXT DEFAULT '',
            colors      TEXT DEFAULT '[]',
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        )
    `);

    // Colors table
    database.exec(`
        CREATE TABLE IF NOT EXISTS colors (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            hex        TEXT NOT NULL,
            dark_hex   TEXT DEFAULT '',
            image      TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `);

    console.log(`✅ Database ready at: ${DB_PATH}`);
}

module.exports = { getDb, initializeDatabase };
