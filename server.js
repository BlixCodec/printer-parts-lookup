require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const db = new Database('./database/printers.db');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Auth routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ success: true, username: user.username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.session.userId);
    res.json({ authenticated: true, username: user.username });
  } else {
    res.json({ authenticated: false });
  }
});

// Printer search with model aliases
app.get('/api/printers/search', requireAuth, (req, res) => {
  const { assetNumber } = req.query;
  
  if (!assetNumber) {
    return res.status(400).json({ error: 'Asset number required' });
  }
  
  const printer = db.prepare('SELECT * FROM printers WHERE assetNumber = ?').get(assetNumber);
  
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }
  
  const modelAliases = require(path.join(__dirname, 'database', 'model-aliases'));
  const searchCodes = [printer.modelCode];
  
  if (modelAliases[printer.modelCode]) {
    searchCodes.push(...modelAliases[printer.modelCode]);
  }
  
  const placeholders = searchCodes.map(() => 'mp.modelCode = ?').join(' OR ');
  
  const parts = db.prepare(`
    SELECT DISTINCT i.id, i.sku, i.description, i.category, i.totalQty
    FROM inventory i
    JOIN model_parts mp ON i.sku = mp.sku
    WHERE ${placeholders}
    ORDER BY i.sku
  `).all(...searchCodes);
  
  res.json({ printer, parts });
});

// Get all printers
app.get('/api/printers', requireAuth, (req, res) => {
  const printers = db.prepare('SELECT * FROM printers ORDER BY room').all();
  res.json(printers);
});

// Get inventory
app.get('/api/inventory', requireAuth, (req, res) => {
  const inventory = db.prepare('SELECT * FROM inventory ORDER BY sku').all();
  res.json(inventory);
});

// Get dashboard stats
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const totalPrinters = db.prepare('SELECT COUNT(*) as count FROM printers').get().count;
  const totalParts = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
  const totalStock = db.prepare('SELECT SUM(totalQty) as total FROM inventory').get().total;
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE totalQty > 0 AND totalQty < 5').get().count;
  const outOfStock = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE totalQty = 0').get().count;
  
  res.json({
    totalPrinters,
    totalParts,
    totalStock,
    lowStock,
    outOfStock
  });
});

// Get printers that use a specific part
app.get('/api/parts/:sku/printers', requireAuth, (req, res) => {
  const { sku } = req.params;
  const modelAliases = require(path.join(__dirname, 'database', 'model-aliases'));
  
  const modelCodes = db.prepare('SELECT DISTINCT modelCode FROM model_parts WHERE sku = ?').all(sku);
  
  if (modelCodes.length === 0) {
    return res.json([]);
  }
  
  const allPrinters = new Map();
  
  modelCodes.forEach(({ modelCode }) => {
    const searchCodes = [modelCode];
    
    for (const [printerCode, aliases] of Object.entries(modelAliases)) {
      if (aliases.includes(modelCode) || printerCode === modelCode) {
        searchCodes.push(printerCode);
      }
    }
    
    const printers = db.prepare(`
      SELECT * FROM printers 
      WHERE modelCode IN (${searchCodes.map(() => '?').join(',')})
    `).all(...searchCodes);
    
    printers.forEach(printer => {
      allPrinters.set(printer.id, printer);
    });
  });
  
  res.json(Array.from(allPrinters.values()));
});

// Search by SKU
app.get('/api/parts/search', requireAuth, (req, res) => {
  const { sku } = req.query;
  
  if (!sku) {
    return res.status(400).json({ error: 'SKU required' });
  }
  
  const part = db.prepare('SELECT * FROM inventory WHERE sku = ?').get(sku.toUpperCase());
  
  if (!part) {
    return res.status(404).json({ error: 'Part not found' });
  }
  
  res.json(part);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});