/**
 * Database Connection and Schema Setup for Neon PostgreSQL
 * Optimized for Netlify Functions using HTTP queries
 */

const { neon } = require('@neondatabase/serverless');

// Use the HTTP-based neon client for better serverless performance
// This is much more reliable in cloud functions than WebSockets/Pools
const sql = neon(process.env.DATABASE_URL);

/**
 * Initialize database schema
 */
async function initializeDatabase() {
    console.log('Initializing database schema via HTTP...');
    
    try {
        // Create patterns table
        await sql(`
            CREATE TABLE IF NOT EXISTS patterns (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image TEXT,
                colors JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add colors column if it doesn't exist
        await sql(`
            ALTER TABLE patterns ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'
        `);
        
        // Create products table
        await sql(`
            CREATE TABLE IF NOT EXISTS products (
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
            )
        `);
        
        // Create colors table
        await sql(`
            CREATE TABLE IF NOT EXISTS colors (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                hex VARCHAR(7) NOT NULL,
                dark_hex VARCHAR(7) NOT NULL,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create indexes
        await sql(`
            CREATE INDEX IF NOT EXISTS idx_products_pattern_id ON products(pattern_id)
        `);
        
        console.log('Database schema checked/initialized');
        
        // Check if we need default data
        const patterns = await sql('SELECT count(*) FROM patterns');
        if (parseInt(patterns[0].count) === 0) {
            console.log('Inserting initial data...');
            // Insert just one pattern to ensure it works
            await sql('INSERT INTO patterns (id, name, description, image, colors) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', 
                ['p1', 'Red Labyrinth', 'Traditional red batik', 'https://res.cloudinary.com/dpdtltd4f/image/upload/v1774200452/design_pattern_1_jhysuj.png', JSON.stringify(['red', 'blue'])]);
        }
        
    } catch (error) {
        console.error('Database init error:', error);
        throw error;
    }
}

// Export the sql client as pool for compatibility with existing routes
module.exports = {
    pool: {
        query: (text, params) => sql(text, params).then(rows => ({ rows }))
    },
    sql,
    initializeDatabase
};
