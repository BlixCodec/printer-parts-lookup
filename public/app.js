let currentUser = null;
let allPrinters = [];
let allParts = [];

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.username;
            showApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('currentUser').textContent = currentUser;
    
    loadDashboardStats();
    loadAllPrinters();
    loadAllParts();
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.textContent = '';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.username;
            showApp();
        } else {
            errorDiv.textContent = 'Invalid username or password';
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please try again.';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    allPrinters = [];
    allParts = [];
    showLogin();
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const stats = await response.json();
        
        document.getElementById('statPrinters').textContent = stats.totalPrinters;
        document.getElementById('statParts').textContent = stats.totalParts;
        document.getElementById('statLowStock').textContent = stats.lowStock;
        document.getElementById('statOutStock').textContent = stats.outOfStock;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Universal search (Asset# or SKU)
document.getElementById('universalSearchBtn').addEventListener('click', universalSearch);
document.getElementById('universalSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') universalSearch();
});

async function universalSearch() {
    const searchTerm = document.getElementById('universalSearch').value.trim().toUpperCase();
    const errorDiv = document.getElementById('universalSearchError');
    const resultsDiv = document.getElementById('searchResults');
    
    errorDiv.textContent = '';
    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
    
    if (!searchTerm) {
        errorDiv.textContent = 'Please enter an Asset Number or SKU';
        return;
    }
    
    // Try as Asset Number first
    try {
        const printerResponse = await fetch(`/api/printers/search?assetNumber=${encodeURIComponent(searchTerm)}`);
        
        if (printerResponse.ok) {
            const data = await printerResponse.json();
            displayPrinterResult(data);
            return;
        }
    } catch (error) {
        console.error('Asset search failed:', error);
    }
    
    // Try as SKU
    try {
        const partResponse = await fetch(`/api/parts/search?sku=${encodeURIComponent(searchTerm)}`);
        
        if (partResponse.ok) {
            const part = await partResponse.json();
            displayPartResult(part);
            return;
        }
    } catch (error) {
        console.error('SKU search failed:', error);
    }
    
    errorDiv.textContent = `No printer or part found for "${searchTerm}"`;
}

function displayPrinterResult(data) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.classList.remove('hidden');
    
    resultsDiv.innerHTML = `
        <div class="search-section">
            <h2>Printer Details</h2>
            <div class="data-card" style="cursor: default;">
                <div class="data-card-header">
                    <div class="data-card-title">${data.printer.assetNumber}</div>
                </div>
                <div class="data-card-body">
                    <strong>Model:</strong> ${data.printer.modelName}<br>
                    <strong>Floor:</strong> ${data.printer.floor}<br>
                    <strong>Room:</strong> ${data.printer.room}
                </div>
            </div>
        </div>
        
        <div class="search-section" style="margin-top: 20px;">
            <h2>Required Parts (${data.parts.length})</h2>
            <div class="data-grid">
                ${data.parts.map(part => `
                    <div class="data-card" onclick="showPartDetails('${part.sku}')">
                        <div class="data-card-header">
                            <div class="data-card-title">${part.sku}</div>
                            <div class="data-card-badge ${getStockBadgeClass(part.totalQty)}">
                                ${part.totalQty} in stock
                            </div>
                        </div>
                        <div class="data-card-body">
                            ${escapeHtml(part.description)}
                        </div>
                        <div class="data-card-footer">
                            ${escapeHtml(part.category)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function displayPartResult(part) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.classList.remove('hidden');
    
    resultsDiv.innerHTML = `
        <div class="search-section">
            <h2>Part Details</h2>
            <div class="data-card" style="cursor: default;">
                <div class="data-card-header">
                    <div class="data-card-title">${part.sku}</div>
                    <div class="data-card-badge ${getStockBadgeClass(part.totalQty)}">
                        ${part.totalQty} in stock
                    </div>
                </div>
                <div class="data-card-body">
                    ${escapeHtml(part.description)}
                </div>
                <div class="data-card-footer">
                    ${escapeHtml(part.category)}
                </div>
            </div>
            <button onclick="showPartDetails('${part.sku}')" style="margin-top: 15px;" class="search-btn">
                View Compatible Printers
            </button>
        </div>
    `;
}

// Load all printers
async function loadAllPrinters() {
    try {
        const response = await fetch('/api/printers');
        allPrinters = await response.json();
        displayPrinters(allPrinters);
    } catch (error) {
        console.error('Failed to load printers:', error);
        document.getElementById('printersLoading').textContent = 'Failed to load printers';
    }
}

function displayPrinters(printers) {
    const loadingDiv = document.getElementById('printersLoading');
    const listDiv = document.getElementById('printersList');
    
    loadingDiv.classList.add('hidden');
    
    if (printers.length === 0) {
        listDiv.innerHTML = '<p class="loading">No printers found</p>';
        return;
    }
    
    listDiv.innerHTML = printers.map(printer => `
        <div class="data-card" onclick="showPrinterDetails('${printer.assetNumber}')">
            <div class="data-card-header">
                <div class="data-card-title">${printer.assetNumber}</div>
            </div>
            <div class="data-card-body">
                <strong>${escapeHtml(printer.modelName)}</strong>
            </div>
            <div class="data-card-footer">
                Floor ${printer.floor} • Room ${printer.room}
            </div>
        </div>
    `).join('');
}

// Printer filter
document.getElementById('printerFilter').addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const filtered = allPrinters.filter(p => 
        p.assetNumber.toLowerCase().includes(filter) ||
        p.modelName.toLowerCase().includes(filter) ||
        p.room.toLowerCase().includes(filter) ||
        p.floor.toLowerCase().includes(filter)
    );
    displayPrinters(filtered);
});

// Load all parts
async function loadAllParts() {
    try {
        const response = await fetch('/api/inventory');
        allParts = await response.json();
        displayParts(allParts);
    } catch (error) {
        console.error('Failed to load parts:', error);
        document.getElementById('partsLoading').textContent = 'Failed to load parts';
    }
}

function displayParts(parts) {
    const loadingDiv = document.getElementById('partsLoading');
    const listDiv = document.getElementById('partsList');
    
    loadingDiv.classList.add('hidden');
    
    if (parts.length === 0) {
        listDiv.innerHTML = '<p class="loading">No parts found</p>';
        return;
    }
    
    listDiv.innerHTML = parts.map(part => `
        <div class="data-card" onclick="showPartDetails('${part.sku}')">
            <div class="data-card-header">
                <div class="data-card-title">${part.sku}</div>
                <div class="data-card-badge ${getStockBadgeClass(part.totalQty)}">
                    ${part.totalQty}
                </div>
            </div>
            <div class="data-card-body">
                ${escapeHtml(part.description)}
            </div>
            <div class="data-card-footer">
                ${escapeHtml(part.category)}
            </div>
        </div>
    `).join('');
}

// Parts filter
document.getElementById('partsFilter').addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const filtered = allParts.filter(p => 
        p.sku.toLowerCase().includes(filter) ||
        p.description.toLowerCase().includes(filter) ||
        p.category.toLowerCase().includes(filter)
    );
    displayParts(filtered);
});

// Show printer details in modal
async function showPrinterDetails(assetNumber) {
    try {
        const response = await fetch(`/api/printers/search?assetNumber=${encodeURIComponent(assetNumber)}`);
        const data = await response.json();
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2 style="margin-bottom: 20px;">Printer Details</h2>
            <div style="background: var(--gray-100); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Asset Number:</strong> ${data.printer.assetNumber}</p>
                <p><strong>Model:</strong> ${data.printer.modelName}</p>
                <p><strong>Floor:</strong> ${data.printer.floor}</p>
                <p><strong>Room:</strong> ${data.printer.room}</p>
            </div>
            
            <h3 style="margin-bottom: 15px;">Required Parts (${data.parts.length})</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${data.parts.map(part => `
                    <div style="padding: 15px; border: 1px solid var(--gray-300); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="font-family: 'Courier New', monospace; color: var(--primary);">${part.sku}</strong>
                            <span class="data-card-badge ${getStockBadgeClass(part.totalQty)}">
                                ${part.totalQty} in stock
                            </span>
                        </div>
                        <p style="font-size: 14px; color: var(--gray-600);">${escapeHtml(part.description)}</p>
                        <p style="font-size: 12px; color: var(--gray-600); margin-top: 5px;"><em>${escapeHtml(part.category)}</em></p>
                    </div>
                `).join('')}
            </div>
        `;
        
        showModal();
    } catch (error) {
        console.error('Failed to load printer details:', error);
    }
}

// Show part details in modal
async function showPartDetails(sku) {
    try {
        const response = await fetch(`/api/parts/${encodeURIComponent(sku)}/printers`);
        const printers = await response.json();
        
        const part = allParts.find(p => p.sku === sku);
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2 style="margin-bottom: 20px;">Part Details</h2>
            <div style="background: var(--gray-100); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <strong style="font-size: 20px; font-family: 'Courier New', monospace;">${sku}</strong>
                    <span class="data-card-badge ${getStockBadgeClass(part.totalQty)}" style="font-size: 16px;">
                        ${part.totalQty} in stock
                    </span>
                </div>
                <p>${escapeHtml(part.description)}</p>
                <p style="margin-top: 10px; font-size: 13px; color: var(--gray-600);"><em>${escapeHtml(part.category)}</em></p>
            </div>
            
            <h3 style="margin-bottom: 15px;">Compatible Printers (${printers.length})</h3>
            ${printers.length === 0 ? '<p style="color: var(--gray-600);">No printers found for this part</p>' : `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${printers.map(printer => `
                        <div style="padding: 15px; border: 1px solid var(--gray-300); border-radius: 8px;">
                            <strong style="color: var(--primary);">${printer.assetNumber}</strong>
                            <p style="font-size: 14px; margin-top: 5px;">${escapeHtml(printer.modelName)}</p>
                            <p style="font-size: 13px; color: var(--gray-600); margin-top: 5px;">Floor ${printer.floor} • Room ${printer.room}</p>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
        
        showModal();
    } catch (error) {
        console.error('Failed to load part details:', error);
    }
}

// Modal controls
function showModal() {
    document.getElementById('modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}

document.querySelector('.modal-close').addEventListener('click', hideModal);
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') hideModal();
});

// Utility functions
function getStockBadgeClass(qty) {
    if (qty === 0) return 'badge-danger';
    if (qty < 5) return 'badge-warning';
    return 'badge-success';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}