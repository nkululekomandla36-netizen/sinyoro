// ==========================================
// SINYORO APP - Main Application Logic
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro Loading...');
    
    // Initialize when translations are ready
    if (window.SinyoroTranslations) {
        initApp();
    } else {
        document.addEventListener('translationsLoaded', initApp);
        // Fallback if event never fires
        setTimeout(initApp, 1000);
    }
});

function initApp() {
    const i18n = window.SinyoroTranslations;
    const t = (key) => i18n ? i18n.getText(key) : key;

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer') || createToastContainer();
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            loading: '⏳'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const titles = {
            info: 'Info',
            success: 'Success',
            warning: 'Warning',
            error: 'Error',
            loading: 'Loading'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <h4 class="toast-title">${titles[type]}</h4>
                <p class="toast-message">${message}</p>
            </div>
            ${type !== 'loading' ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => removeToast(toast));
        }

        if (type !== 'loading' && duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }

        return toast;
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
        return container;
    }

    function removeToast(toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400);
    }

    // ==========================================
    // INDEXEDDB SETUP
    // ==========================================
    const DB_NAME = 'SinyoroDB';
    const DB_VERSION = 2;
    let db;

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
        console.error('Database failed to open');
        showToast('Using local storage mode', 'warning');
    };
    
    request.onsuccess = () => {
        db = request.result;
        console.log('Database ready');
        loadMarketItems();
    };
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            itemsStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('favorites')) {
            db.createObjectStore('favorites', { keyPath: 'itemId' });
        }
    };

    // ==========================================
    // CONNECTION STATUS
    // ==========================================
    function updateConnectionStatus() {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        
        if (!statusDot || !statusText) return;

        if (navigator.onLine) {
            statusDot.className = 'status-dot online';
            statusText.textContent = '🌐 Online - Connected';
            statusDot.style.background = '#10b981';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = '📴 Offline Mode';
            statusDot.style.background = '#f59e0b';
        }
    }

    window.addEventListener('online', () => {
        updateConnectionStatus();
        showToast('Back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        updateConnectionStatus();
        showToast('Offline mode active', 'warning');
    });

    // ==========================================
    // MOBILE MENU
    // ==========================================
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('mobile-open');
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navMenu.classList.remove('mobile-open');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ==========================================
    // MODAL MANAGEMENT
    // ==========================================
    const postItemModal = document.getElementById('postItemModal');
    const closeBtn = postItemModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const modalOverlay = postItemModal?.querySelector('.modal-overlay');

    function openModal() {
        if (!postItemModal) return;
        postItemModal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!postItemModal) return;
        postItemModal.hidden = true;
        document.body.style.overflow = '';
        document.getElementById('postItemForm')?.reset();
        clearImagePreview();
    }

    document.getElementById('postItemBtn')?.addEventListener('click', openModal);
    document.getElementById('postFirstItemBtn')?.addEventListener('click', openModal);
    document.getElementById('helpPostItemBtn')?.addEventListener('click', openModal);
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && postItemModal && !postItemModal.hidden) {
            closeModal();
        }
    });

    // ==========================================
    // IMAGE UPLOAD
    // ==========================================
    const imageInput = document.getElementById('itemImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showToast('Image too large. Max 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (imagePreview && imagePreviewContainer) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', clearImagePreview);
    }

    function clearImagePreview() {
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    document.getElementById('browseMarketBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
        document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Smooth scroll for all hash links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navMenu?.classList.remove('mobile-open');
                mobileMenuToggle?.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Hero category cards click to filter
    document.querySelectorAll('.hero-category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            if (category) {
                document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                const filterBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
                if (filterBtn) {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    filterBtn.classList.add('active');
                    filterMarketItems(category);
                }
            }
        });
    });

    // ==========================================
    // MARKET FILTERS
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            filterMarketItems(btn.dataset.category);
        });
    });

    function filterMarketItems(category) {
        const cards = document.querySelectorAll('.market-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const matches = category === 'all' || card.dataset.category === category;
            card.style.display = matches ? 'flex' : 'none';
            if (matches) visibleCount++;
        });

        showToast(`Showing ${visibleCount} items`, 'success', 2000);
    }

    // ==========================================
    // FORM SUBMISSION
    // ==========================================
    const postItemForm = document.getElementById('postItemForm');
    
    if (postItemForm) {
        postItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const itemData = {
                name: document.getElementById('itemName')?.value.trim(),
                category: document.getElementById('itemCategory')?.value,
                description: document.getElementById('itemDescription')?.value.trim(),
                price: document.getElementById('itemPrice')?.value.trim(),
                location: document.getElementById('itemLocation')?.value.trim() || 'Not specified',
                sellerName: document.getElementById('sellerName')?.value.trim(),
                contactMethod: document.getElementById('contactMethod')?.value || 'phone',
                imageData: imagePreview?.src || null,
                date: new Date().toISOString(),
                synced: false
            };

            if (!itemData.name || !itemData.category || !itemData.description || !itemData.price || !itemData.sellerName) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            // Save to localStorage as fallback
            try {
                const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                items.push({ ...itemData, id: Date.now() });
                localStorage.setItem('sinyoro_items', JSON.stringify(items));
                
                showToast('Item posted successfully!', 'success');
                closeModal();
                postItemForm.reset();
                loadMarketItems();
            } catch (err) {
                showToast('Failed to save item', 'error');
            }
        });
    }

    // ==========================================
    // LOAD MARKET ITEMS
    // ==========================================
    function loadMarketItems() {
        // Load sample items if none exist
        const sampleItems = [
            { id: 1, name: 'Maize - 50kg Bag', category: 'food', description: 'Grade A, dried and ready', price: '$25 or barter', location: '2km away', sellerName: 'Mama Sarah', date: new Date().toISOString() },
            { id: 2, name: 'Goats - 3 Available', category: 'livestock', description: 'Healthy, vaccinated', price: 'Barter for tools', location: '5km away', sellerName: 'Baba John', date: new Date().toISOString() },
            { id: 3, name: 'Farming Tools Set', category: 'tools', description: 'Hoe, rake, and shovel', price: '$15', location: '1km away', sellerName: 'Peter M.', date: new Date().toISOString() }
        ];

        const stored = localStorage.getItem('sinyoro_items');
        const items = stored ? JSON.parse(stored) : sampleItems;
        
        renderMarketItems(items);
    }

    function renderMarketItems(items) {
        const grid = document.getElementById('marketGrid');
        if (!grid) return;

        const icons = {
            food: '🌾',
            livestock: '🐐',
            tools: '🛠️',
            services: '💼',
            herbs: '🌿'
        };

        grid.innerHTML = items.map(item => `
            <article class="glass-card market-card" data-category="${item.category}" data-item-id="${item.id}">
                <div class="card-header">
                    <div class="item-image">${icons[item.category] || '📦'}</div>
                    <span class="category-tag">${item.category}</span>
                    <button class="favorite-btn" data-item-id="${item.id}">☆</button>
                </div>
                <div class="card-body">
                    <h3 class="item-title">${item.name}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-meta">
                        <div class="meta-row">
                            <span class="price-tag">
                                <span class="meta-icon">💰</span>
                                <span>${item.price}</span>
                            </span>
                            <span class="distance-tag">
                                <span class="meta-icon">📍</span>
                                <span>${item.location}</span>
                            </span>
                        </div>
                        <div class="seller-row">
                            <div class="seller-info">
                                <span>👤 ${item.sellerName}</span>
                            </div>
                            <span class="trust-badge trusted">⭐ Trusted</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary contact-btn">Contact Seller</button>
                </div>
            </article>
        `).join('');
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    updateConnectionStatus();
    loadMarketItems();
    
    // Welcome message
    if (!localStorage.getItem('sinyoro_welcomed')) {
        setTimeout(() => {
            showToast('Welcome to Sinyoro! 🌾 Start trading offline.', 'success', 5000);
            localStorage.setItem('sinyoro_welcomed', 'true');
        }, 1000);
    }

    console.log('✅ Sinyoro Ready!');
}
