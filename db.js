/**
 * Database Connection and Schema Setup for Neon PostgreSQL
 * Handles connection to Neon database and initializes tables
 */

const { Pool } = require('pg');

// Neon PostgreSQL connection configuration
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_yO5WwZTlhgU3@ep-curly-hill-aehfipu7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

/**
 * Initialize database schema
 * Creates tables for patterns, products, and colors if they don't exist
 */
async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        // Start transaction
        await client.query('BEGIN');
        
        // Create patterns table
        await client.query(`
            CREATE TABLE IF NOT EXISTS patterns (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create products table
        await client.query(`
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
        await client.query(`
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
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_pattern_id ON products(pattern_id)
        `);
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('Database schema initialized successfully');
        
        // Insert default data if tables are empty
        await insertDefaultData(client);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing database schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Insert default data if tables are empty
 */
async function insertDefaultData(client) {
    try {
        // Check if patterns table is empty
        const patternsResult = await client.query('SELECT COUNT(*) as count FROM patterns');
        if (parseInt(patternsResult.rows[0].count) === 0) {
            console.log('Inserting default patterns...');
            const defaultPatterns = [
                {
                    id: 'p1',
                    name: 'Floral Elegance',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                    description: 'Handmade floral batik design with intricate patterns'
                },
                {
                    id: 'p2',
                    name: 'Peacock Majesty',
                    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
                    description: 'Majestic peacock inspired traditional Sri Lankan batik'
                },
                {
                    id: 'p3',
                    name: 'Elephant Heritage',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                    description: 'Gentle elephant design representing Sri Lankan culture'
                },
                {
                    id: 'p4',
                    name: 'Lotus Serenity',
                    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
                    description: 'Symbol of purity and enlightenment in batik art'
                },
                {
                    id: 'p5',
                    name: 'Ocean Waves',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                    description: 'Inspired by the beautiful Indian Ocean waves'
                }
            ];
            
            for (const pattern of defaultPatterns) {
                await client.query(
                    'INSERT INTO patterns (id, name, description, image) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                    [pattern.id, pattern.name, pattern.description, pattern.image]
                );
            }
        }
        
        // Check if products table is empty
        const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
        if (parseInt(productsResult.rows[0].count) === 0) {
            console.log('Inserting default products...');
            const defaultProducts = [
                {
                    id: 'prod1',
                    pattern_id: 'p1',
                    name: 'Floral Saree',
                    type: 'Saree',
                    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
                    description: 'Beautiful handmade saree with floral batik design',
                    price: '15,000 LKR',
                    color_images: '{}'
                },
                {
                    id: 'prod2',
                    pattern_id: 'p1',
                    name: 'Floral Frock',
                    type: 'Frock',
                    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
                    description: 'Elegant frock with traditional floral patterns',
                    price: '8,500 LKR',
                    color_images: '{}'
                },
                {
                    id: 'prod3',
                    pattern_id: 'p2',
                    name: 'Peacock Saree',
                    type: 'Saree',
                    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
                    description: 'Stunning saree featuring peacock batik design',
                    price: '18,000 LKR',
                    color_images: '{}'
                },
                {
                    id: 'prod4',
                    pattern_id: 'p3',
                    name: 'Elephant Sarong',
                    type: 'Sarong',
                    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
                    description: 'Comfortable sarong with elephant heritage design',
                    price: '4,500 LKR',
                    color_images: '{}'
                }
            ];
            
            for (const product of defaultProducts) {
                await client.query(
                    'INSERT INTO products (id, pattern_id, name, type, description, image, price, color_images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                    [product.id, product.pattern_id, product.name, product.type, product.description, product.image, product.price, product.color_images]
                );
            }
        }
        
        // Check if colors table is empty
        const colorsResult = await client.query('SELECT COUNT(*) as count FROM colors');
        if (parseInt(colorsResult.rows[0].count) === 0) {
            console.log('Inserting default colors...');
            const defaultColors = [
                { id: 'green', name: 'Green', hex: '#2d5a27', dark_hex: '#1e4d1a', image: '' },
                { id: 'blue', name: 'Blue', hex: '#1e3a5f', dark_hex: '#152a45', image: '' },
                { id: 'red', name: 'Red', hex: '#8b2942', dark_hex: '#6d2034', image: '' },
                { id: 'purple', name: 'Purple', hex: '#4a3068', dark_hex: '#3a2552', image: '' },
                { id: 'gold', name: 'Gold', hex: '#b8860b', dark_hex: '#8b6914', image: '' },
                { id: 'black', name: 'Black', hex: '#2d2d2d', dark_hex: '#1a1a1a', image: '' }
            ];
            
            for (const color of defaultColors) {
                await client.query(
                    'INSERT INTO colors (id, name, hex, dark_hex, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
                    [color.id, color.name, color.hex, color.dark_hex, color.image]
                );
            }
        }
        
        console.log('Default data inserted successfully');
    } catch (error) {
        console.error('Error inserting default data:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase
};
