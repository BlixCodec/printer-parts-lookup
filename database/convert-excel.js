// Run this script to convert your Excel files to the format needed for seed.js
// Install dependencies first: npm install xlsx
// Usage: node database/convert-excel.js

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('📊 Excel to JSON Converter\n');

// Function to extract model code from model name
function extractModelCode(modelName) {
    if (!modelName) return 'UNKNOWN';
    
    // Extract key identifiers from model names
    if (modelName.includes('AltaLink C8145')) return 'C8145';
    if (modelName.includes('AltaLink C8135')) return 'C8135';
    if (modelName.includes('AltaLink C8235')) return 'C8235';
    if (modelName.includes('AltaLink B8255')) return 'B8255';
    if (modelName.includes('VersaLink B620')) return 'B620';
    if (modelName.includes('VersaLink B625')) return 'B625';
    if (modelName.includes('VersaLink B605')) return 'B605';
    if (modelName.includes('VersaLink C400')) return 'C400';
    if (modelName.includes('VersaLink C415')) return 'C415';
    if (modelName.includes('VersaLink C620')) return 'C620';
    if (modelName.includes('WorkCentre 7835')) return 'WC7835';
    if (modelName.includes('WorkCentre 6655')) return 'WC6655';
    if (modelName.includes('Phaser 3320')) return 'Phaser3320';
    if (modelName.includes('Designjet T790')) return 'T790';
    if (modelName.includes('Designjet T920')) return 'T920';
    
    return modelName.split(' ')[0];
}

// Convert printers from XSM export
function convertPrinters(excelPath) {
    console.log(`📁 Reading: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    const printers = data.map(row => ({
        assetNumber: row['Asset Number'],
        modelName: row['Model Name'],
        modelCode: extractModelCode(row['Model Name']),
        floor: String(row['Floor'] || ''),
        room: row['Room'],
        site: row['Site Name']
    }));
    
    console.log(`✅ Converted ${printers.length} printers\n`);
    
    // Save to JSON
    const outputPath = path.join(__dirname, 'printers.json');
    fs.writeFileSync(outputPath, JSON.stringify(printers, null, 2));
    console.log(`💾 Saved to: ${outputPath}\n`);
    
    return printers;
}

// Convert inventory from BarCloud export
function convertInventory(excelPath) {
    console.log(`📁 Reading: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);
    
    // Skip header row and aggregate by SKU
    const inventoryMap = {};
    
    rawData.slice(1).forEach(row => {
        const sku = row['__EMPTY'];
        const description = row['__EMPTY_1'];
        const category = row['__EMPTY_2'];
        const qty = parseInt(row['__EMPTY_4']) || 0;
        
        if (sku && sku !== 'Stock Item #') {
            if (!inventoryMap[sku]) {
                inventoryMap[sku] = {
                    sku: sku,
                    description: description,
                    category: category,
                    totalQty: 0
                };
            }
            inventoryMap[sku].totalQty += qty;
        }
    });
    
    const inventory = Object.values(inventoryMap);
    console.log(`✅ Converted ${inventory.length} unique SKUs\n`);
    
    // Save to JSON
    const outputPath = path.join(__dirname, 'inventory.json');
    fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));
    console.log(`💾 Saved to: ${outputPath}\n`);
    
    return inventory;
}

// Generate model-to-parts mapping
function generateModelPartsMapping(inventory) {
    console.log('🔗 Generating model-to-parts mapping...');
    
    const mappings = [];
    
    inventory.forEach(item => {
        // Extract model codes from parentheses in description
        const match = item.description.match(/\(([^)]+)\)/);
        
        if (match) {
            const modelCodes = match[1].split(',').map(m => m.trim());
            
            modelCodes.forEach(modelCode => {
                mappings.push({
                    modelCode: modelCode,
                    sku: item.sku
                });
            });
        }
    });
    
    console.log(`✅ Generated ${mappings.length} mappings\n`);
    
    // Save to JSON
    const outputPath = path.join(__dirname, 'model-parts.json');
    fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
    console.log(`💾 Saved to: ${outputPath}\n`);
    
    return mappings;
}

// Main execution
function main() {
    console.log('='.repeat(60));
    console.log('INSTRUCTIONS:');
    console.log('1. Place your Excel files in the database/ folder:');
    console.log('   - AssetGroup_AllAssets4dfed.xls (XSM printers export)');
    console.log('   - Export 1.xlsx (BarCloud inventory export)');
    console.log('2. Run: node database/convert-excel.js');
    console.log('3. Then run: node database/seed.js');
    console.log('='.repeat(60));
    console.log();
    
    const printersPath = path.join(__dirname, 'AssetGroup_AllAssets4dfed.xls');
    const inventoryPath = path.join(__dirname, 'Export 1.xlsx');
    
    // Check if files exist
    if (!fs.existsSync(printersPath)) {
        console.error(`❌ File not found: ${printersPath}`);
        console.log('Please place your XSM export in the database/ folder');
        return;
    }
    
    if (!fs.existsSync(inventoryPath)) {
        console.error(`❌ File not found: ${inventoryPath}`);
        console.log('Please place your BarCloud export in the database/ folder');
        return;
    }
    
    try {
        // Convert both files
        const printers = convertPrinters(printersPath);
        const inventory = convertInventory(inventoryPath);
        const mappings = generateModelPartsMapping(inventory);
        
        console.log('='.repeat(60));
        console.log('✅ CONVERSION COMPLETE!');
        console.log();
        console.log('Generated files:');
        console.log('  - database/printers.json');
        console.log('  - database/inventory.json');
        console.log('  - database/model-parts.json');
        console.log();
        console.log('Summary:');
        console.log(`  - ${printers.length} printers`);
        console.log(`  - ${inventory.length} unique parts`);
        console.log(`  - ${mappings.length} model-part mappings`);
        console.log();
        console.log('Next step: Run "node database/seed.js"');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        console.error(error.stack);
    }
}

main();