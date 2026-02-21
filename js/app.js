// Sinyoro App - Rural Community Marketplace
// Offline-first trading platform for essential goods

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro Rural Marketplace Loaded');

    // ==========================================
    // OFFLINE STORAGE SETUP
    // ==========================================
    const DB_NAME = 'SinyoroDB';
    const DB_VERSION = 1;
    let db;

    // Initialize IndexedDB for offline storage
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => console.log('Database failed to open');
    request.onsuccess = () => {
        db = request.result;
        console.log('✅ Offline database ready');
        loadMarketItems();
    };
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('items')) {
            db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }
    };

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.9rem; font-weight: 600;">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <p style="margin: 0; font-size: 0.85rem; line-height: 1.4;">${message}</p>
            </div>
        `;

        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 1rem 1.25rem;
            border-radius: 12px;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            z-index: 99999;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            min-width: 280px;
            max-width: 350px;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ==========================================
    // NAVIGATION BUTTONS
    // ==========================================
    
    // Post Item Button
    const postItemBtn = document.getElementById('postItemBtn');
    const postItemModal = document.getElementById('postItemModal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (postItemBtn && postItemModal) {
        postItemBtn.addEventListener('click', () => {
            postItemModal.style.display = 'flex';
            showToast('Create your listing offline. Will sync when online.', 'info');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            postItemModal.style.display = 'none';
        });
    }

    // Profile Button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showToast('Profile feature coming soon! 👤', 'info');
        });
    }

    // Browse Market Button
    const browseMarketBtn = document.getElementById('browseMarketBtn');
    if (browseMarketBtn) {
        browseMarketBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('market').scrollIntoView({ behavior: 'smooth' });
            showToast('Showing local items near you 📍', 'success');
        });
    }

    // Post First Item Button
    const postFirstItemBtn = document.getElementById('postFirstItemBtn');
    if (postFirstItemBtn) {
        postFirstItemBtn.addEventListener('click', () => {
            postItemModal.style.display = 'flex';
        });
    }

    // ==========================================
    // MARKET FILTERS
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const marketCards = document.querySelectorAll('.market-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category;
            
            // Filter items
            marketCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            showToast(`Showing ${category === 'all' ? 'all' : category} items`, 'success');
        });
    });

    // ==========================================
    // CONTACT SELLER BUTTONS
    // ==========================================
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('contact-btn')) {
            const card = e.target.closest('.market-card');
            const itemName = card.querySelector('h3').textContent;
            const seller = card.querySelector('.seller-info span').textContent;
            
            showToast(`Contacting ${seller} about ${itemName}... 📱`, 'success');
            
            // In real app: Open SMS/call dialog
            setTimeout(() => {
                alert(`📞 Call or SMS ${seller}\n📝 About: ${itemName}\n\n(In real app, this would open your phone's dialer)`);
            }, 500);
        }
    });

    // ==========================================
    // POST ITEM FORM
    // ==========================================
    const postItemForm = document.getElementById('postItemForm');
    if (postItemForm) {
        postItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(postItemForm);
            const item = {
                name: postItemForm.querySelector('input[type="text"]').value,
                category: postItemForm.querySelector('select').value,
                description: postItemForm.querySelector('textarea').value,
                price: postItemForm.querySelectorAll('input')[1].value,
                date: new Date().toISOString(),
                offline: !navigator.onLine
            };

            // Save to IndexedDB (offline storage)
            if (db) {
                const transaction = db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                store.add(item);
                
                transaction.oncomplete = () => {
                    showToast('✅ Item saved offline! Will post when online.', 'success');
                    postItemModal.style.display = 'none';
                    postItemForm.reset();
                };
            } else {
                showToast('⚠️ Storage not ready. Please try again.', 'warning');
            }
        });
    }

    // ==========================================
    // LOAD MARKET ITEMS (Offline First)
    // ==========================================
    function loadMarketItems() {
        if (!db) return;
        
        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.getAll();

        request.onsuccess = () => {
            const items = request.result;
            console.log(`📦 Loaded ${items.length} items from offline storage`);
            // In real app: Render these items to the market grid
        };
    }

    // ==========================================
    // NETWORK STATUS MONITORING
    // ==========================================
    function updateOnlineStatus() {
        if (navigator.onLine) {
            showToast('🌐 Back online! Syncing data...', 'success');
            // Sync offline items to server
        } else {
            showToast('📴 Offline mode. Using saved data.', 'warning');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check initial status
    if (!navigator.onLine) {
        showToast('📴 Starting in offline mode', 'info');
    }

    // ==========================================
    // SMOOTH SCROLLING
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    console.log('✅ Sinyoro Marketplace Ready - Offline First!');
});
