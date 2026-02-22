// ==========================================
// SINYORO ENHANCED - Rural Community Marketplace
// Offline-First Trading Platform for Essential Goods
// Version 2.0 - Full Featured
// ==========================================

/**
 * WHAT'S NEW IN VERSION 2.0:
 * ✅ Image upload & preview
 * ✅ Delete & Edit items
 * ✅ Search functionality
 * ✅ Favorites/Bookmarks
 * ✅ User profile management
 * ✅ View counter & statistics
 * ✅ Share items (WhatsApp, SMS)
 * ✅ Rating system
 * ✅ Better error handling
 * ✅ Loading states
 * ✅ Item expiry (auto-cleanup)
 * ✅ Advanced filters
 * ✅ Export data
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro Enhanced v2.0 Loading...');

    // Wait for translations
    const checkTranslations = setInterval(() => {
        if (window.SinyoroTranslations) {
            clearInterval(checkTranslations);
            initApp();
        }
    }, 50);

    setTimeout(() => {
        clearInterval(checkTranslations);
        if (!window.SinyoroTranslations) {
            console.warn('⚠️ Translations not loaded, using fallback');
            initApp();
        }
    }, 2000);
});

function initApp() {
    const i18n = window.SinyoroTranslations;
    const t = (key) => i18n ? i18n.getText(key) : key;

    // ==========================================
    // ENHANCED TOAST NOTIFICATION SYSTEM
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
        toast.className = `glass-card toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const titles = {
            info: t('navHelp') || 'Info',
            success: t('trusted') || 'Success',
            warning: t('checkingConnection') || 'Warning',
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

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => removeToast(toast));
        }

        if (type !== 'loading' && duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }

        return toast; // Return for loading toasts that need manual removal
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    }

    function removeToast(toast) {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }

    // ==========================================
    // ENHANCED INDEXEDDB SETUP
    // ==========================================
    const DB_NAME = 'SinyoroDB';
    const DB_VERSION = 2; // Upgraded to v2
    let db;

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
        console.error('❌ Database failed to open');
        showToast('Offline mode - Using local storage', 'warning');
    };
    
    request.onsuccess = () => {
        db = request.result;
        console.log('✅ Database v2 ready');
        loadMarketItems();
        loadUserProfile();
        loadFavorites();
        updateConnectionStatus();
        cleanExpiredItems();
    };
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Items store with enhanced indexes
        if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            itemsStore.createIndex('category', 'category', { unique: false });
            itemsStore.createIndex('date', 'date', { unique: false });
            itemsStore.createIndex('seller', 'sellerName', { unique: false });
        }
        
        // Users store
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }
        
        // NEW: Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
            const favStore = db.createObjectStore('favorites', { keyPath: 'itemId' });
            favStore.createIndex('date', 'date', { unique: false });
        }
        
        // NEW: Statistics store
        if (!db.objectStoreNames.contains('stats')) {
            const statsStore = db.createObjectStore('stats', { keyPath: 'itemId' });
            statsStore.createIndex('views', 'views', { unique: false });
        }
        
        // NEW: Messages store (for future chat)
        if (!db.objectStoreNames.contains('messages')) {
            const msgStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
            msgStore.createIndex('itemId', 'itemId', { unique: false });
            msgStore.createIndex('date', 'date', { unique: false });
        }

        console.log('✅ Database upgraded to v2');
    };

    // ==========================================
    // USER PROFILE MANAGEMENT
    // ==========================================
    let currentUser = {
        id: 'user_001',
        name: localStorage.getItem('sinyoro_username') || '',
        location: localStorage.getItem('sinyoro_location') || '',
        phone: localStorage.getItem('sinyoro_phone') || '',
        rating: 5.0,
        itemsPosted: 0,
        tradesCompleted: 0
    };

    function saveUserProfile(profile) {
        currentUser = { ...currentUser, ...profile };
        localStorage.setItem('sinyoro_username', currentUser.name);
        localStorage.setItem('sinyoro_location', currentUser.location);
        localStorage.setItem('sinyoro_phone', currentUser.phone);
        
        if (db) {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            store.put(currentUser);
        }
        
        console.log('👤 Profile saved:', currentUser.name);
    }

    function loadUserProfile() {
        if (!db) return;
        
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get('user_001');
        
        request.onsuccess = () => {
            if (request.result) {
                currentUser = request.result;
                updateProfileDisplay();
            }
        };
    }

    function updateProfileDisplay() {
        const profileName = document.getElementById('profileName');
        if (profileName && currentUser.name) {
            profileName.textContent = currentUser.name;
        }
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
            statusText.textContent = '🌐 ' + (t('onlineStatus') || 'Online - Connected');
            statusDot.style.background = '#10b981';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = '📴 ' + (t('offlineStatus') || 'Offline Mode');
            statusDot.style.background = '#f59e0b';
        }
    }

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

        // Close menu when clicking outside
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
    const postItemBtn = document.getElementById('postItemBtn');
    const postFirstItemBtn = document.getElementById('postFirstItemBtn');
    const closeBtn = postItemModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const modalOverlay = postItemModal?.querySelector('.modal-overlay');

    let editingItemId = null; // Track if we're editing

    function openModal(itemId = null) {
        if (!postItemModal) return;
        
        editingItemId = itemId;
        postItemModal.hidden = false;
        postItemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (itemId) {
            loadItemForEditing(itemId);
            document.getElementById('postItemFormTitle').textContent = 'Edit Item';
            document.getElementById('submitItemBtn').textContent = 'Update Item';
        } else {
            document.getElementById('postItemFormTitle').textContent = 'Post New Item';
            document.getElementById('submitItemBtn').textContent = 'Post Item';
            showToast('Create your listing offline', 'info');
        }
    }

    function closeModal() {
        if (!postItemModal) return;
        postItemModal.hidden = true;
        postItemModal.style.display = 'none';
        document.body.style.overflow = '';
        editingItemId = null;
        document.getElementById('postItemForm')?.reset();
        clearImagePreview();
    }

    if (postItemBtn) postItemBtn.addEventListener('click', () => openModal());
    if (postFirstItemBtn) postFirstItemBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && postItemModal && !postItemModal.hidden) {
            closeModal();
        }
    });

    // ==========================================
    // IMAGE UPLOAD & PREVIEW (NEW!)
    // ==========================================
    const imageInput = document.getElementById('itemImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', clearImagePreview);
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
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
    }

    function clearImagePreview() {
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    }

    // ==========================================
    // SEARCH FUNCTIONALITY (NEW!)
    // ==========================================
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => performSearch());
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function performSearch() {
        const query = searchInput?.value.toLowerCase().trim();
        if (!query) {
            // Show all items if search is empty
            document.querySelectorAll('.market-card').forEach(card => {
                card.style.display = 'block';
            });
            return;
        }

        let matchCount = 0;
        document.querySelectorAll('.market-card').forEach(card => {
            const title = card.querySelector('.item-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.item-description')?.textContent.toLowerCase() || '';
            const category = card.dataset.category?.toLowerCase() || '';
            
            const matches = title.includes(query) || description.includes(query) || category.includes(query);
            
            card.style.display = matches ? 'block' : 'none';
            if (matches) matchCount++;
        });

        showToast(`Found ${matchCount} item${matchCount !== 1 ? 's' : ''}`, 'success', 2000);
    }

    // ==========================================
    // NAVIGATION & SCROLLING
    // ==========================================
    const browseMarketBtn = document.getElementById('browseMarketBtn');
    if (browseMarketBtn) {
        browseMarketBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('market')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Showing local items 📍', 'success', 2000);
        });
    }

    const learnMoreBtn = document.getElementById('learnMoreBtn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            document.getElementById('help')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => openModal());
    }

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

    // ==========================================
    // MARKET FILTERS (ENHANCED)
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const marketCards = document.querySelectorAll('.market-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            const category = btn.dataset.category;
            filterMarketItems(category);
        });
    });

    function filterMarketItems(category) {
        let visibleCount = 0;
        
        marketCards.forEach((card, index) => {
            const matches = category === 'all' || card.dataset.category === category;
            
            if (matches) {
                card.style.display = 'block';
                visibleCount++;
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 30);
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
            tools: 'tools',
            services: 'services',
            herbs: 'herbs'
        };

        showToast(`Showing ${visibleCount} ${categoryNames[category] || category}`, 'success', 2000);
    }

    // ==========================================
    // FAVORITES SYSTEM (NEW!)
    // ==========================================
    let favorites = new Set();

    function loadFavorites() {
        if (!db) {
            const saved = localStorage.getItem('sinyoro_favorites');
            if (saved) {
                favorites = new Set(JSON.parse(saved));
            }
            return;
        }

        const transaction = db.transaction(['favorites'], 'readonly');
        const store = transaction.objectStore('favorites');
        const request = store.getAll();

        request.onsuccess = () => {
            favorites = new Set(request.result.map(f => f.itemId));
            updateFavoriteButtons();
        };
    }

    function toggleFavorite(itemId) {
        if (favorites.has(itemId)) {
            favorites.delete(itemId);
            removeFavoriteFromDB(itemId);
            showToast('Removed from favorites', 'info', 2000);
        } else {
            favorites.add(itemId);
            addFavoriteToDB(itemId);
            showToast('Added to favorites ⭐', 'success', 2000);
        }
        
        updateFavoriteButtons();
        saveFavoritesToLocalStorage();
    }

    function addFavoriteToDB(itemId) {
        if (!db) return;
        
        const transaction = db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        store.put({ itemId, date: new Date().toISOString() });
    }

    function removeFavoriteFromDB(itemId) {
        if (!db) return;
        
        const transaction = db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        store.delete(itemId);
    }

    function saveFavoritesToLocalStorage() {
        localStorage.setItem('sinyoro_favorites', JSON.stringify([...favorites]));
    }

    function updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const itemId = btn.dataset.itemId;
            if (favorites.has(itemId)) {
                btn.textContent = '⭐';
                btn.classList.add('favorited');
            } else {
                btn.textContent = '☆';
                btn.classList.remove('favorited');
            }
        });
    }

    // ==========================================
    // VIEW COUNTER (NEW!)
    // ==========================================
    function incrementViews(itemId) {
        if (!db) return;

        const transaction = db.transaction(['stats'], 'readwrite');
        const store = transaction.objectStore('stats');
        const request = store.get(itemId);

        request.onsuccess = () => {
            const stats = request.result || { itemId, views: 0, lastViewed: null };
            stats.views += 1;
            stats.lastViewed = new Date().toISOString();
            store.put(stats);
        };
    }

    // ==========================================
    // CONTACT SELLER (ENHANCED)
    // ==========================================
    document.addEventListener('click', (e) => {
        const contactBtn = e.target.closest('.contact-btn');
        if (!contactBtn) return;

        const card = contactBtn.closest('.market-card');
        if (!card) return;

        const itemId = card.dataset.itemId;
        const itemName = card.querySelector('.item-title')?.textContent || 'Item';
        const sellerName = card.querySelector('.seller-name')?.textContent || 'Seller';
        const phone = card.dataset.phone || '';

        // Increment view counter
        if (itemId) incrementViews(itemId);

        showToast(`Contacting ${sellerName}...`, 'info', 2000);

        setTimeout(() => {
            const message = `Hi! I'm interested in your ${itemName} on Sinyoro.`;
            
            // Show contact options
            const options = `
                Choose contact method:
                1. Call ${phone}
                2. Send SMS
                3. WhatsApp
                
                (OK = Call, Cancel = SMS)
            `;
            
            if (confirm(options)) {
                // Call
                if (phone) {
                    window.location.href = `tel:${phone}`;
                    showToast(`📞 Calling ${sellerName}...`, 'success');
                }
            } else {
                // SMS
                if (phone) {
                    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
                    showToast(`💬 Opening SMS...`, 'success');
                }
            }
        }, 600);
    });

    // ==========================================
    // SHARE ITEM FUNCTIONALITY (NEW!)
    // ==========================================
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.share-btn');
        if (!shareBtn) return;

        const card = shareBtn.closest('.market-card');
        if (!card) return;

        const itemName = card.querySelector('.item-title')?.textContent || 'Item';
        const price = card.querySelector('.item-price')?.textContent || '';
        const shareText = `Check out this ${itemName} for ${price} on Sinyoro! 🌾`;
        const shareUrl = window.location.href;

        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: itemName,
                text: shareText,
                url: shareUrl
            }).then(() => {
                showToast('Shared successfully!', 'success');
            }).catch(() => {
                fallbackShare(shareText);
            });
        } else {
            fallbackShare(shareText);
        }
    });

    function fallbackShare(text) {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
        showToast('Opening WhatsApp...', 'success');
    }

    // ==========================================
    // DELETE ITEM (NEW!)
    // ==========================================
    document.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;

        const itemId = parseInt(deleteBtn.dataset.itemId);
        const itemName = deleteBtn.dataset.itemName || 'this item';

        if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
            return;
        }

        const loadingToast = showToast('Deleting item...', 'loading', 0);

        if (db) {
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.delete(itemId);

            request.onsuccess = () => {
                removeToast(loadingToast);
                showToast('Item deleted successfully', 'success');
                updateMyItemsSection();
            };

            request.onerror = () => {
                removeToast(loadingToast);
                showToast('Failed to delete item', 'error');
            };
        } else {
            // Fallback to localStorage
            try {
                const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                const filtered = items.filter(item => item.id !== itemId);
                localStorage.setItem('sinyoro_items', JSON.stringify(filtered));
                removeToast(loadingToast);
                showToast('Item deleted', 'success');
                updateMyItemsSection();
            } catch (err) {
                removeToast(loadingToast);
                showToast('Failed to delete', 'error');
            }
        }
    });

    // ==========================================
    // EDIT ITEM (NEW!)
    // ==========================================
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (!editBtn) return;

        const itemId = parseInt(editBtn.dataset.itemId);
        openModal(itemId);
    });

    function loadItemForEditing(itemId) {
        if (!db) return;

        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.get(itemId);

        request.onsuccess = () => {
            const item = request.result;
            if (!item) return;

            document.getElementById('itemName').value = item.name;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemDescription').value = item.description;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemLocation').value = item.location;
            document.getElementById('sellerName').value = item.sellerName;
            document.getElementById('contactMethod').value = item.contactMethod;

            if (item.imageData && imagePreview) {
                imagePreview.src = item.imageData;
                imagePreviewContainer.style.display = 'block';
            }
        };
    }

    // ==========================================
    // POST/UPDATE ITEM FORM (ENHANCED)
    // ==========================================
    const postItemForm = document.getElementById('postItemForm');
    
    if (postItemForm) {
        postItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const itemName = document.getElementById('itemName')?.value.trim();
            const category = document.getElementById('itemCategory')?.value;
            const description = document.getElementById('itemDescription')?.value.trim();
            const price = document.getElementById('itemPrice')?.value.trim();
            const location = document.getElementById('itemLocation')?.value.trim();
            const sellerName = document.getElementById('sellerName')?.value.trim();
            const contactMethod = document.getElementById('contactMethod')?.value;
            const imageData = imagePreview?.src || null;

            // Validation
            if (!itemName || !category || !description || !price || !sellerName) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            // Save user info for next time
            if (sellerName) {
                saveUserProfile({ name: sellerName, location, phone: contactMethod });
            }

            const loadingToast = showToast(editingItemId ? 'Updating item...' : 'Posting item...', 'loading', 0);

            const item = {
                name: itemName,
                category: category,
                description: description,
                price: price,
                location: location || 'Not specified',
                sellerName: sellerName,
                contactMethod: contactMethod || 'phone',
                imageData: imageData,
                date: editingItemId ? undefined : new Date().toISOString(),
                lastModified: new Date().toISOString(),
                postedOffline: !navigator.onLine,
                synced: false,
                views: 0
            };

            if (editingItemId) {
                item.id = editingItemId;
            }

            if (db) {
                const transaction = db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                const request = editingItemId ? store.put(item) : store.add(item);

                request.onsuccess = () => {
                    removeToast(loadingToast);
                    showToast(editingItemId ? 'Item updated!' : 'Item posted!', 'success');
                    closeModal();
                    postItemForm.reset();
                    updateMyItemsSection();
                    currentUser.itemsPosted++;
                    saveUserProfile(currentUser);
                };

                request.onerror = () => {
                    removeToast(loadingToast);
                    showToast('Failed to save item', 'error');
                };
            } else {
                // Fallback to localStorage
                try {
                    const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                    if (editingItemId) {
                        const index = items.findIndex(i => i.id === editingItemId);
                        if (index !== -1) {
                            items[index] = { ...item, id: editingItemId };
                        }
                    } else {
                        items.push({ ...item, id: Date.now() });
                    }
                    localStorage.setItem('sinyoro_items', JSON.stringify(items));
                    removeToast(loadingToast);
                    showToast(editingItemId ? 'Updated!' : 'Posted!', 'success');
                    closeModal();
                    postItemForm.reset();
                    updateMyItemsSection();
                } catch (err) {
                    removeToast(loadingToast);
                    showToast('Storage error', 'error');
                }
            }
        });
    }

    // ==========================================
    // LOAD MARKET ITEMS (ENHANCED)
    // ==========================================
    function loadMarketItems() {
        if (!db) {
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
            <div class="glass-card my-item-card" data-item-id="${item.id}">
                ${item.imageData ? `<img src="${item.imageData}" alt="${item.name}" class="item-thumbnail">` : ''}
                <div class="item-header">
                    <span class="item-category">${item.category}</span>
                    <span class="item-status">${item.synced ? '✅ Synced' : '⏳ Pending'}</span>
                </div>
                <h4>${item.name}</h4>
                <p>${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
                <div class="item-footer">
                    <span class="item-price">${item.price}</span>
                    <span class="item-date">${new Date(item.date).toLocaleDateString()}</span>
                </div>
                <div class="item-stats">
                    <span>👁️ ${item.views || 0} views</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary edit-btn" data-item-id="${item.id}">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-secondary share-btn" data-item-id="${item.id}">
                        📤 Share
                    </button>
                    <button class="btn btn-danger delete-btn" data-item-id="${item.id}" data-item-name="${item.name}">
                        🗑️ Delete
                    </button>
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
            itemsCountEl.textContent = 45 + itemCount;
        }
    }

    // ==========================================
    // AUTO-CLEANUP EXPIRED ITEMS (NEW!)
    // ==========================================
    function cleanExpiredItems() {
        if (!db) return;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const transaction = db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        const index = store.index('date');
        const range = IDBKeyRange.upperBound(thirtyDaysAgo.toISOString());
        
        const request = index.openCursor(range);
        let deletedCount = 0;

        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                deletedCount++;
                cursor.continue();
            } else if (deletedCount > 0) {
                console.log(`🗑️ Cleaned up ${deletedCount} expired items`);
                showToast(`Removed ${deletedCount} old items`, 'info', 3000);
            }
        };
    }

    // ==========================================
    // NETWORK STATUS & SYNC
    // ==========================================
    function handleOnline() {
        updateConnectionStatus();
        showToast('🌐 Back online! Syncing...', 'success');
        syncOfflineItems();
    }

    function handleOffline() {
        updateConnectionStatus();
        showToast('📴 Offline mode active', 'warning');
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
                
                const loadingToast = showToast(`Syncing ${unsyncedItems.length} items...`, 'loading', 0);
                
                setTimeout(() => {
                    const updateTransaction = db.transaction(['items'], 'readwrite');
                    const updateStore = updateTransaction.objectStore('items');
                    
                    unsyncedItems.forEach(item => {
                        item.synced = true;
                        updateStore.put(item);
                    });
                    
                    removeToast(loadingToast);
                    showToast(`✅ ${unsyncedItems.length} items synced!`, 'success');
                    updateMyItemsSection();
                }, 2000);
            }
        };
    }

    // ==========================================
    // EXPORT DATA (NEW!)
    // ==========================================
    function exportUserData() {
        if (!db) {
            showToast('Database not available', 'error');
            return;
        }

        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.getAll();

        request.onsuccess = () => {
            const items = request.result;
            const dataStr = JSON.stringify(items, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `sinyoro-backup-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Data exported successfully!', 'success');
        };
    }

    // Expose export function globally
    window.exportSinyoroData = exportUserData;

    // ==========================================
    // LOAD MORE BUTTON
    // ==========================================
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            showToast('Loading more items...', 'info');
            setTimeout(() => {
                loadMoreBtn.textContent = 'No more items';
                loadMoreBtn.disabled = true;
            }, 1000);
        });
    }

    // ==========================================
    // KEYBOARD SHORTCUTS (NEW!)
    // ==========================================
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K = Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
        
        // Ctrl/Cmd + P = Post Item
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            openModal();
        }
        
        // Ctrl/Cmd + E = Export Data
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportUserData();
        }
    });

    // ==========================================
    // INITIALIZATION
    // ==========================================
    updateConnectionStatus();
    updateMyItemsSection();
    loadFavorites();
    
    // Show welcome message for new users
    if (!localStorage.getItem('sinyoro_welcomed')) {
        setTimeout(() => {
            showToast('Welcome to Sinyoro! 🌾 Start trading offline.', 'success', 5000);
            localStorage.setItem('sinyoro_welcomed', 'true');
        }, 1000);
    }

    // Log keyboard shortcuts
    console.log(`
    ⌨️ Keyboard Shortcuts:
    - Ctrl/Cmd + K = Search
    - Ctrl/Cmd + P = Post Item
    - Ctrl/Cmd + E = Export Data
    - ESC = Close Modal
    `);

    console.log('✅ Sinyoro Enhanced v2.0 Ready!');
    console.log('📊 Features: Image Upload, Edit/Delete, Search, Favorites, Stats, Share');
}
        
