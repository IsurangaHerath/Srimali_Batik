import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'srimali.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

export interface PatternRow {
    id: string;
    name: string;
    description: string;
    image: string;
    colors: string;
    created_at: string;
    updated_at: string;
}

export interface ProductRow {
    id: string;
    pattern_id: string;
    name: string;
    type: string;
    description: string;
    image: string;
    price: string;
    colors: string;
    created_at: string;
    updated_at: string;
}

export interface ColorRow {
    id: string;
    name: string;
    hex: string;
    dark_hex: string;
    image: string;
    created_at: string;
    updated_at: string;
}

export function initializeDatabase(): void {
    const database = getDb();

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

    console.log(`Database ready at: ${DB_PATH}`);
}
