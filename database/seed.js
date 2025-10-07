const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'printers.db');
const db = new Database(dbPath);

// Read schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🚀 Starting database setup...\n');

// Execute schema - run each statement separately
const statements = schema.split(';').filter(s => s.trim());
statements.forEach(stmt => {
    if (stmt.trim()) {
        db.exec(stmt + ';');
    }
});
console.log('✅ Database schema created\n');

// Create default user
async function createDefaultUser() {
    const hashedPassword = await bcrypt.hash('PFItech123', 10);
    
    const insert = db.prepare(`
        INSERT OR REPLACE INTO users (username, password)
        VALUES (?, ?)
    `);
    
    insert.run('admin', hashedPassword);
    console.log('✅ Default user created (username: admin, password: PFItech123)\n');
    console.log('⚠️  IMPORTANT: Change this password in production!\n');
}

// Seed printers from JSON
function seedPrinters() {
    console.log('📝 Seeding printers...');
    
    const jsonPath = path.join(__dirname, 'printers.json');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ printers.json not found!');
        console.log('Run "node database/convert-excel.js" first to generate it.\n');
        process.exit(1);
    }
    
    const printers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const insert = db.prepare(`
        INSERT OR REPLACE INTO printers (assetNumber, modelName, modelCode, floor, room, site, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    printers.forEach(p => {
        insert.run(
            p.assetNumber,
            p.modelName,
            p.modelCode,
            p.floor,
            p.room,
            p.site || 'USA/TX/Houston/91-51',
            'Active'
        );
    });
    
    console.log(`✅ Inserted ${printers.length} printers\n`);
}

// Seed inventory from JSON
function seedInventory() {
    console.log('📦 Seeding inventory...');
    
    const jsonPath = path.join(__dirname, 'inventory.json');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ inventory.json not found!');
        console.log('Run "node database/convert-excel.js" first to generate it.\n');
        process.exit(1);
    }
    
    const inventory = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const insert = db.prepare(`
        INSERT OR REPLACE INTO inventory (sku, description, category, totalQty)
        VALUES (?, ?, ?, ?)
    `);
    
    inventory.forEach(item => {
        insert.run(item.sku, item.description, item.category, item.totalQty);
    });
    
    console.log(`✅ Inserted ${inventory.length} inventory items\n`);
}

// Seed model-parts mappings from JSON
function seedModelParts() {
    console.log('🔗 Seeding model-to-parts mappings...');
    
    const jsonPath = path.join(__dirname, 'model-parts.json');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ model-parts.json not found!');
        console.log('Run "node database/convert-excel.js" first to generate it.\n');
        process.exit(1);
    }
    
    const mappings = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const insert = db.prepare(`
        INSERT OR IGNORE INTO model_parts (modelCode, sku)
        VALUES (?, ?)
    `);
    
    mappings.forEach(mapping => {
        insert.run(mapping.modelCode, mapping.sku);
    });
    
    console.log(`✅ Created ${mappings.length} model-to-part mappings\n`);
}

// Apply manual parts mappings for non-Xerox equipment
function applyManualMappings() {
    console.log('🔧 Applying manual parts mappings...');
    
    const manualMap = require(path.join(__dirname, 'manual-parts-map'));
    const insert = db.prepare(`
        INSERT OR IGNORE INTO model_parts (modelCode, sku)
        VALUES (?, ?)
    `);
    
    let mappingCount = 0;
    
    Object.entries(manualMap).forEach(([modelCode, skus]) => {
        skus.forEach(sku => {
            // Only insert if the SKU exists in inventory
            const partExists = db.prepare('SELECT sku FROM inventory WHERE sku = ?').get(sku);
            if (partExists) {
                insert.run(modelCode, sku);
                mappingCount++;
            }
        });
    });
    
    console.log(`✅ Applied ${mappingCount} manual mappings\n`);
}

// Display summary statistics
function displayStats() {
    const printerCount = db.prepare('SELECT COUNT(*) as count FROM printers').get().count;
    const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    const mappingCount = db.prepare('SELECT COUNT(*) as count FROM model_parts').get().count;
    const totalStock = db.prepare('SELECT SUM(totalQty) as total FROM inventory').get().total;
    
    console.log('📊 Database Statistics:');
    console.log(`   Printers: ${printerCount}`);
    console.log(`   Inventory Items: ${inventoryCount}`);
    console.log(`   Total Stock Units: ${totalStock}`);
    console.log(`   Model-Part Mappings: ${mappingCount}\n`);
}

// Main execution
async function main() {
    try {
        await createDefaultUser();
        seedPrinters();
        seedInventory();
        seedModelParts();
        applyManualMappings();
        displayStats();
        
        console.log('🎉 Database setup complete!\n');
        console.log('Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Visit: http://localhost:8080');
        console.log('3. Login with: admin / PFItech123\n');
        console.log('To deploy to Discloud:');
        console.log('1. Set SESSION_SECRET in your environment variables');
        console.log('2. Upload your project folder');
        console.log('3. Discloud will run "npm start" automatically\n');
        
    } catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

main();