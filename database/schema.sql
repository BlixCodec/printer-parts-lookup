-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Printers table
CREATE TABLE IF NOT EXISTS printers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assetNumber TEXT UNIQUE NOT NULL,
  modelName TEXT NOT NULL,
  modelCode TEXT NOT NULL,
  floor TEXT,
  room TEXT,
  site TEXT,
  status TEXT DEFAULT 'Active'
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  totalQty INTEGER DEFAULT 0
);

-- Model to parts mapping
CREATE TABLE IF NOT EXISTS model_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  modelCode TEXT NOT NULL,
  sku TEXT NOT NULL,
  FOREIGN KEY (sku) REFERENCES inventory(sku)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_printers_asset ON printers(assetNumber);
CREATE INDEX IF NOT EXISTS idx_printers_model ON printers(modelCode);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_model_parts_code ON model_parts(modelCode);