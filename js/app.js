/* ======================================================
   SINYORO APP.JS - FIXED VERSION
   Main Application Logic (NO LANGUAGE CODE - handled by translations.js)
====================================================== */

/* -----------------------------
   GLOBAL STATE
----------------------------- */
let marketItems = [];

/* -----------------------------
   UTILITIES
----------------------------- */
function showToast(message, duration = 3000) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;z-index:99999;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* -----------------------------
   CONNECTION STATUS
----------------------------- */
function checkConnection() {
    const statusDot = document.getElementById("connectionStatus");
    const statusText = document.getElementById("statusText");
    if (!statusDot || !statusText) return;
    
    if (navigator.onLine) {
        statusDot.style.backgroundColor = "#10b981";
        statusText.textContent = "Online";
    } else {
        statusDot.style.backgroundColor = "#f59e0b";
        statusText.textContent = "Offline mode";
    }
}

/* -----------------------------
   MOBILE MENU
----------------------------- */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    
    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('mobile-open');
        toggle.setAttribute('aria-expanded', isOpen);
    });
}

/* -----------------------------
   MODAL
----------------------------- */
function initModal() {
    const modal = document.getElementById('postItemModal');
    const openBtns = [document.getElementById('postItemBtn'), document.getElementById('postFirstItemBtn'), document.getElementById('helpPostItemBtn')];
    const closeBtn = modal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const overlay = modal?.querySelector('.modal-overlay');
    
    function open() {
        if (!modal) return;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }
    
    function close() {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = '';
        document.getElementById('postItemForm')?.reset();
        document.getElementById('imagePreviewContainer').style.display = 'none';
    }
    
    openBtns.forEach(btn => btn?.addEventListener('click', open));
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal?.hidden) close();
    });
}

/* -----------------------------
   IMAGE PREVIEW
----------------------------- */
function initImagePreview() {
    const input = document.getElementById('itemImage');
    const preview = document.getElementById('imagePreview');
    const container = document.getElementById('imagePreviewContainer');
    const removeBtn = document.getElementById('removeImageBtn');
    
    if (!input) return;
    
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        container.style.display = 'block';
    });
    
    removeBtn?.addEventListener('click', () => {
        input.value = '';
        preview.src = '';
        container.style.display = 'none';
    });
}

/* -----------------------------
   MARKET ITEMS
----------------------------- */
function createMarketItem(data) {
    return {
        id: Date.now(),
        title: data.title,
        category: data.category,
        description: data.description || "",
        price: data.price || "",
        seller: data.seller || "",
        location: data.location || "",
        image: data.image || null,
        createdAt: new Date().toISOString()
    };
}

function saveItems() {
    localStorage.setItem("sinyoro_market_items", JSON.stringify(marketItems));
}

function loadItems() {
    const saved = localStorage.getItem("sinyoro_market_items");
    if (saved) {
        try { marketItems = JSON.parse(saved); } catch { marketItems = []; }
    }
}

function renderMarketItems() {
    const container = document.getElementById("marketGrid");
    if (!container) return;
    
    container.innerHTML = marketItems.map(item => `
        <article class="glass-card market-card" data-item-id="${item.id}">
            <div class="card-header">
                <div class="item-image">📦</div>
                <span class="category-tag">${item.category}</span>
            </div>
            <div class="card-body">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-meta">
                    <div class="meta-row">
                        <span class="price-tag">💰 ${item.price}</span>
                        <span class="distance-tag">📍 ${item.location || 'Unknown'}</span>
                    </div>
                    <div class="seller-row">
                        <div class="seller-info">👤 ${item.seller}</div>
                        <span class="trust-badge">⭐ Trusted</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-full">Contact Seller</button>
            </div>
        </article>
    `).join('');
}

function handleAddItem(form) {
    const title = document.getElementById('itemName')?.value.trim();
    const category = document.getElementById('itemCategory')?.value;
    const description = document.getElementById('itemDescription')?.value.trim();
    const price = document.getElementById('itemPrice')?.value;
    const seller = document.getElementById('sellerName')?.value.trim();
    const location = document.getElementById('itemLocation')?.value.trim();
    
    if (!title || !category || !seller) {
        showToast("Please fill required fields");
        return;
    }
    
    const item = createMarketItem({ title, category, description, price, seller, location });
    marketItems.unshift(item);
    saveItems();
    renderMarketItems();
    
    // Close modal
    document.getElementById('postItemModal').hidden = true;
    document.body.style.overflow = '';
    form.reset();
    document.getElementById('imagePreviewContainer').style.display = 'none';
    
    showToast("Item posted successfully!");
}

/* -----------------------------
   FILTERS
----------------------------- */
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            
            const category = btn.dataset.category;
            document.querySelectorAll('.market-card').forEach(card => {
                card.style.display = (category === 'all' || card.dataset.category === category) ? 'flex' : 'none';
            });
        });
    });
}

/* -----------------------------
   NAVIGATION
----------------------------- */
function initNavigation() {
    document.getElementById('browseMarketBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
        document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/* -----------------------------
   INIT
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    console.log('Sinyoro app initializing...');
    
    checkConnection();
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    
    initMobileMenu();
    initModal();
    initImagePreview();
    initFilters();
    initNavigation();
    
    loadItems();
    renderMarketItems();
    
    // Form submission
    document.getElementById("postItemForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        handleAddItem(e.target);
    });
    
    console.log('Sinyoro app ready!');
});
