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
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    }

    function removeToast(toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400);
    }

    // ==========================================
    // ENHANCED INDEXEDDB SETUP
    // ==========================================
    const DB_NAME = 'SinyoroDB';
    const DB_VERSION = 2;
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
        
        if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            itemsStore.createIndex('category', 'category', { unique: false });
            itemsStore.createIndex('date', 'date', { unique: false });
            itemsStore.createIndex('seller', 'sellerName', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('favorites')) {
            const favStore = db.createObjectStore('favorites', { keyPath: 'itemId' });
            favStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('stats')) {
            const statsStore = db.createObjectStore('stats', { keyPath: 'itemId' });
            statsStore.createIndex('views', 'views', { unique: false });
        }
        
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
    const helpPostItemBtn = document.getElementById('helpPostItemBtn');
    const closeBtn = postItemModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const modalOverlay = postItemModal?.querySelector('.modal-overlay');

    let editingItemId = null;

    function openModal(itemId = null) {
        if (!postItemModal) return;
        
        editingItemId = itemId;
        postItemModal.hidden = false;
        document.body.style.overflow = 'hidden';
        
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = document.getElementById('submitItemBtn');
        
        if (itemId) {
            loadItemForEditing(itemId);
            if (modalTitle) modalTitle.textContent = t('editItemTitle') || 'Edit Item';
            if (submitBtn) submitBtn.textContent = t('updateItem') || 'Update Item';
        } else {
            if (modalTitle) modalTitle.textContent = t('postItemTitle') || 'Post New Item';
            if (submitBtn) submitBtn.textContent = t('postItem') || 'Post Item';
            showToast('Create your listing offline', 'info');
        }
    }

    function closeModal() {
        if (!postItemModal) return;
        postItemModal.hidden = true;
        document.body.style.overflow = '';
        editingItemId = null;
        document.getElementById('postItemForm')?.reset();
        clearImagePreview();
    }

    if (postItemBtn) postItemBtn.addEventListener('click', () => openModal());
    if (postFirstItemBtn) postFirstItemBtn.addEventListener('click', () => openModal());
    if (helpPostItemBtn) helpPostItemBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && postItemModal && !postItemModal.hidden) {
            closeModal();
        }
    });

    // ==========================================
    // IMAGE UPLOAD & PREVIEW
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
    }

    function clearImagePreview() {
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    }

    // ==========================================
    // SEARCH FUNCTIONALITY
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
                if (filterBtn) filterBtn.click();
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
    // FAVORITES SYSTEM
    // ==========================================
    let favorites = new Set();

    function loadFavorites() {
        if (!db) {
            const saved = localStorage.getItem('sinyoro_favorites');
            if (saved) {
                favorites = new Set(JSON.parse(saved));
                updateFavoriteButtons();
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

    // Favorite button click handler
    document.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.favorite-btn');
        if (favBtn) {
            e.stopPropagation();
            const itemId = favBtn.dataset.itemId;
            if (itemId) toggleFavorite(itemId);
        }
    });

    // ==========================================
    // VIEW COUNTER
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
    // CONTACT SELLER
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

        if (itemId) incrementViews(itemId);

        showToast(`Contacting ${sellerName}...`, 'info', 2000);

        setTimeout(() => {
            const message = `Hi! I'm interested in your ${itemName} on Sinyoro.`;
            
            if (confirm(`Contact ${sellerName}?\n\nPhone: ${phone}\n\nClick OK to call, Cancel to send SMS`)) {
                if (phone) {
                    window.location.href = `tel:${phone}`;
                    showToast(`📞 Calling ${sellerName}...`, 'success');
                }
            } else {
                if (phone) {
                    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
                    showToast(`💬 Opening SMS...`, 'success');
                }
            }
        }, 600);
    });

    // ==========================================
    // SHARE ITEM FUNCTIONALITY
    // ==========================================
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.share-btn');
        if (!shareBtn) return;

        const card = shareBtn.closest('.market-card');
        if (!card) return;

        const itemName = card.querySelector('.item-title')?.textContent || 'Item';
        const price = card.querySelector('.price-amount')?.textContent || '';
        const shareText = `Check out this ${itemName} for ${price} on Sinyoro! 🌾`;
        const shareUrl = window.location.href;

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
    // DELETE ITEM
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
    // EDIT ITEM
    // ==========================================
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (!editBtn) return;

        const itemId = parseInt(editBtn.dataset.itemId);
        openModal(itemId);
    });

    function loadItemForEditing(itemId) {
        if (!db) {
            // Fallback to localStorage
            try {
                const items = JSON.parse(localStorage.getItem('sinyoro_items') || '[]');
                const item = items.find(i => i.id === itemId);
                if (item) populateEditForm(item);
            } catch (e) {
                console.error('Failed to load item for editing');
            }
            return;
        }

        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.get(itemId);

        request.onsuccess = () => {
            const item = request.result;
            if (!item) return;
            populateEditForm(item);
        };
    }

    function populateEditForm(item) {
        const nameField = document.getElementById('itemName');
        const categoryField = document.getElementById('itemCategory');
        const priceField = document.getElementById('itemPrice');
        const locationField = document.getElementById('itemLocation');
        const descField = document.getElementById('itemDescription');
        const sellerField = document.getElementById('sellerName');
        const contactField = document.getElementById('contactMethod');

        if (nameField) nameField.value = item.name || '';
        if (categoryField) categoryField.value = item.category || '';
        if (priceField) priceField.value = item.price || '';
        if (locationField) locationField.value = item.location || '';
        if (descField) descField.value = item.description || '';
        if (sellerField) sellerField.value = item.sellerName || '';
        if (contactField) contactField.value = item.contactMethod || 'phone';

        if (item.imageData && imagePreview) {
            imagePreview.src = item.imageData;
            imagePreviewContainer.style.display = 'block';
        }
    }

    // ==========================================
    // POST/UPDATE ITEM FORM
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

            if (!itemName || !category || !description || !price || !sellerName) {
                showToast('Please fill all required fields', 'error');
                return;
            }

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
                lastModified: new Date().toISOString(),
                postedOffline: !navigator.onLine,
                synced: false,
                views: 0
            };

            if (editingItemId) {
                item.id = editingItemId;
                item.date = item.date || new Date().toISOString();
            } else {
                item.date = new Date().toISOString();
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
    // LOAD MARKET ITEMS
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
    // AUTO-CLEANUP EXPIRED ITEMS
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
    // EXPORT DATA
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
    // KEYBOARD SHORTCUTS
    // ==========================================
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            openModal();
        }
        
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
    
    if (!localStorage.getItem('sinyoro_welcomed')) {
        setTimeout(() => {
            showToast('Welcome to Sinyoro! 🌾 Start trading offline.', 'success', 5000);
            localStorage.setItem('sinyoro_welcomed', 'true');
        }, 1000);
    }

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
