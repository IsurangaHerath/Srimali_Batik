/**
 * Database Connection for Neon PostgreSQL
 * Optimized for Netlify Functions using HTTP queries (No WebSockets needed)
 */

const { neon } = require('@neondatabase/serverless');

// Use the HTTP-based neon client - extremely reliable for serverless
const sql = neon(process.env.DATABASE_URL);

/**
 * Robust wrapper for pool-like queries
 * @param {string} text - The SQL query
 * @param {Array} params - The query parameters
 */
const query = async (text, params = []) => {
    try {
        console.log(`[DB Query] ${text.substring(0, 50)}...`);
        // neon() returns an array of rows directly
        const rows = await sql(text, params);
        // Map to standard pg-like response for compatibility with existing routes
        return { rows: Array.isArray(rows) ? rows : [] };
    } catch (err) {
        console.error('Database Query Error:', err);
        throw err;
    }
};

/**
 * Lightweight schema check/init (only called when needed)
 */
async function initializeDatabase() {
    console.log('Verifying database schema...');
    try {
        // Just ensure tables exist if they don't
        await sql(`CREATE TABLE IF NOT EXISTS patterns (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image TEXT,
            colors JSONB DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await sql(`CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            pattern_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            description TEXT,
            image TEXT,
            price VARCHAR(100),
            color_images JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
        )`);
        
        await sql(`CREATE TABLE IF NOT EXISTS colors (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            hex VARCHAR(7) NOT NULL,
            dark_hex VARCHAR(7) NOT NULL,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('Schema verification complete.');
    } catch (error) {
        console.error('Schema initialization failed:', error);
        throw error;
    }
}

module.exports = {
    pool: { query },
    sql,
    initializeDatabase
};
