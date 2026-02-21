// Sinyoro App - Rural Community Marketplace
// Offline-first trading platform for essential goods

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro Rural Marketplace Loaded');

    // ==========================================
    // OFFLINE STORAGE SETUP (IndexedDB)
    // ==========================================
    const DB_NAME = 'SinyoroDB';
    const DB_VERSION = 1;
    let db;

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
        console.error('❌ Database failed to open');
        showToast('Storage not available. Some features may not work.', 'warning');
    };
    
    request.onsuccess = () => {
        db = request.result;
        console.log('✅ Offline database ready');
        loadMarketItems();
        updateConnectionStatus();
    };
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            itemsStore.createIndex('category', 'category', { unique: false });
            itemsStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }
    };

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || document.body;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <h4 class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        // Use CSS classes instead of inline styles for better maintainability
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

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto remove after delay
        setTimeout(() => removeToast(toast), 4000);
    }

    function removeToast(toast) {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }

    // ==========================================
    // CONNECTION STATUS
    // ==========================================
    function updateConnectionStatus() {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        
        if (!statusDot || !statusText) return;

        if (navigator.onLine) {
            statusDot.className = 'status-dot online';
            statusText.textContent = '🌐 Online - Full features available';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = '📴 Offline mode - Using saved data';
        }
    }

    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('mobile-open');
        });
    }

    // ==========================================
    // MODAL MANAGEMENT
    // ==========================================
    const postItemModal = document.getElementById('postItemModal');
    const postItemBtn = document.getElementById('postItemBtn');
    const postFirstItemBtn = document.getElementById('postFirstItemBtn');
    const closeBtn = postItemModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const modalOverlay = postItemModal?.querySelector('.modal-overlay');

    function openModal() {
        if (!postItemModal) return;
        postItemModal.hidden = false;
        postItemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        showToast('Create your listing. It will be saved offline.', 'info');
    }

    function closeModal() {
        if (!postItemModal) return;
        postItemModal.hidden = true;
        postItemModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (postItemBtn) postItemBtn.addEventListener('click', openModal);
    if (postFirstItemBtn) postFirstItemBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && postItemModal && !postItemModal.hidden) {
            closeModal();
        }
    });

    // ==========================================
    // NAVIGATION & SCROLLING
    // ==========================================
    
    // Browse Market Button
    const browseMarketBtn = document.getElementById('browseMarketBtn');
    if (browseMarketBtn) {
        browseMarketBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('market')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Showing local items near you 📍', 'success');
        });
    }

    // Learn More Button
    const learnMoreBtn = document.getElementById('learnMoreBtn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            document.getElementById('help')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Get Started Button
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            openModal();
        });
    }

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Close mobile menu if open
                navMenu?.classList.remove('mobile-open');
                mobileMenuToggle?.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // ==========================================
    // MARKET FILTERS
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const marketCards = document.querySelectorAll('.market-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active states
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            const category = btn.dataset.category;
            
            // Filter items with animation
            marketCards.forEach((card, index) => {
                const matches = category === 'all' || card.dataset.category === category;
                
                if (matches) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });

            const categoryNames = {
                all: 'all items',
                food: 'food & crops',
                livestock: 'livestock',
                tools: 'tools & equipment',
                services: 'services'
            };

            showToast(`Showing ${categoryNames[category] || category}`, 'success');
        });
    });

    // ==========================================
    // CONTACT SELLER BUTTONS
    // ==========================================
    document.addEventListener('click', (e) => {
        const contactBtn = e.target.closest('.contact-btn');
        if (!contactBtn) return;

        const card = contactBtn.closest('.market-card');
        if (!card) return;

        const itemName = card.querySelector('.item-title')?.textContent || 'Item';
        const sellerName = card.querySelector('.seller-name')?.textContent || 'Seller';
        const item = contactBtn.dataset.item;
        const seller = contactBtn.dataset.seller;

        showToast(`Opening contact options for ${sellerName}...`, 'info');

        // Simulate contact dialog
        setTimeout(() => {
            const contactMethod = confirm(`📞 Contact ${sellerName} about ${itemName}\n\nClick OK to simulate a phone call\nClick Cancel to simulate SMS`);
            
            if (contactMethod) {
                showToast(`📞 Calling ${sellerName}... (simulated)`, 'success');
            } else {
                showToast(`💬 SMS sent to ${sellerName}... (simulated)`, 'success');
            }
        }, 600);
    });

    // ==========================================
    // POST ITEM FORM
    // ==========================================
    const postItemForm = document.getElementById('postItemForm');
    
    if (postItemForm) {
        postItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values using proper selectors
            const itemName = document.getElementById('itemName')?.value.trim();
            const category = document.getElementById('itemCategory')?.value;
            const description = document.getElementById('itemDescription')?.value.trim();
            const price = document.getElementById('itemPrice')?.value.trim();
            const location = document.getElementById('itemLocation')?.value.trim();
            const sellerName = document.getElementById('sellerName')?.value.trim();
            const contactMethod = document.getElementById('contactMethod')?.value;

            // Validation
            if (!itemName || !category || !description || !price || !sellerName) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            const item = {
                name: itemName,
                category: category,
                description: description,
                price: price,
                location: location || 'Not specified',
                sellerName: sellerName,
                contactMethod: contactMethod || 'phone',
                date: new Date().toISOString(),
                postedOffline: !navigator.onLine,
                synced: false
            };

            // Save to IndexedDB
            if (db) {
                const transaction = db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                const request = store.add(item);

                request.onsuccess = () => {
                    showToast('✅ Item saved! It will be visible to others when online.', 'success');
                    closeModal();
                    postItemForm.reset();
                    
                    // Update empty state if this is first item
                    updateMyItemsSection();
                };

                request.onerror = () => {
                    showToast('❌ Failed to save item. Please try again.', 'error');
                };
            } else {
                // Fallback to localStorage if IndexedDB fails
                try {
                    const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                    items.push({ ...item, id: Date.now() });
                    localStorage.setItem('sinyoro_items', JSON.stringify(items));
                    showToast('✅ Item saved locally!', 'success');
                    closeModal();
                    postItemForm.reset();
                    updateMyItemsSection();
                } catch (err) {
                    showToast('⚠️ Storage not available.', 'error');
                }
            }
        });
    }

    // ==========================================
    // LOAD MARKET ITEMS (Offline First)
    // ==========================================
    function loadMarketItems() {
        if (!db) {
            // Try localStorage fallback
            try {
                const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                console.log(`📦 Loaded ${items.length} items from localStorage`);
                renderUserItems(items);
            } catch (e) {
                console.log('No storage available');
            }
            return;
        }
        
        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.getAll();

        request.onsuccess = () => {
            const items = request.result;
            console.log(`📦 Loaded ${items.length} items from IndexedDB`);
            renderUserItems(items);
            updateStats(items.length);
        };
    }

    function renderUserItems(items) {
        const myItemsList = document.getElementById('myItemsList');
        const emptyState = document.getElementById('emptyState');
        
        if (!myItemsList || !emptyState) return;

        if (items.length === 0) {
            myItemsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        myItemsList.style.display = 'grid';
        myItemsList.innerHTML = items.map(item => `
            <div class="glass-card my-item-card">
                <div class="item-header">
                    <span class="item-category">${item.category}</span>
                    <span class="item-status">${item.synced ? '✅ Synced' : '⏳ Pending'}</span>
                </div>
                <h4>${item.name}</h4>
                <p>${item.description.substring(0, 100)}...</p>
                <div class="item-footer">
                    <span class="item-price">${item.price}</span>
                    <span class="item-date">${new Date(item.date).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    function updateMyItemsSection() {
        if (db) {
            loadMarketItems();
        } else {
            try {
                const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                renderUserItems(items);
            } catch (e) {
                console.error('Failed to update items');
            }
        }
    }

    function updateStats(itemCount) {
        const itemsCountEl = document.getElementById('itemsCount');
        if (itemsCountEl) {
            itemsCountEl.textContent = 45 + itemCount; // Base + user items
        }
    }

    // ==========================================
    // NETWORK STATUS MONITORING
    // ==========================================
    function handleOnline() {
        updateConnectionStatus();
        showToast('🌐 Back online! Syncing your listings...', 'success');
        
        // Attempt to sync offline items
        syncOfflineItems();
    }

    function handleOffline() {
        updateConnectionStatus();
        showToast('📴 Offline mode activated. Using saved data.', 'warning');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    function syncOfflineItems() {
        if (!db) return;

        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.getAll();

        request.onsuccess = () => {
            const unsyncedItems = request.result.filter(item => !item.synced);
            
            if (unsyncedItems.length > 0) {
                console.log(`Syncing ${unsyncedItems.length} items...`);
                
                // Simulate sync process
                setTimeout(() => {
                    const updateTransaction = db.transaction(['items'], 'readwrite');
                    const updateStore = updateTransaction.objectStore('items');
                    
                    unsyncedItems.forEach(item => {
                        item.synced = true;
                        updateStore.put(item);
                    });
                    
                    showToast(`✅ ${unsyncedItems.length} items synced successfully!`, 'success');
                    updateMyItemsSection();
                }, 1500);
            }
        };
    }

    // ==========================================
    // LOAD MORE BUTTON
    // ==========================================
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            showToast('Loading more items... (demo)', 'info');
            loadMoreBtn.textContent = 'No more items';
            loadMoreBtn.disabled = true;
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    // Check initial connection status
    updateConnectionStatus();
    
    // Load user items
    updateMyItemsSection();

    console.log('✅ Sinyoro Marketplace Ready - Offline First!');
});
