// ==========================================
// SINYORO APP - Main Application Logic (COMPLETED)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sinyoro app initializing...');
    
    // Wait a bit for translations to initialize first
    setTimeout(function() {
        initApp();
    }, 100);
});

function initApp() {
    console.log('Initializing app...');
    
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
    // LOAD MARKET ITEMS
    // ==========================================
    function loadMarketItems() {
        const sampleItems = [
            { id: 1, name: 'Maize - 50kg Bag', category: 'food', description: 'Grade A, dried and ready', price: '$25 or barter', location: '2km away', sellerName: 'Mama Sarah' },
            { id: 2, name: 'Goats - 3 Available', category: 'livestock', description: 'Healthy, vaccinated', price: 'Barter for tools', location: '5km away', sellerName: 'Baba John' },
            { id: 3, name: 'Farming Tools Set', category: 'tools', description: 'Hoe, rake, and shovel', price: '$15', location: '1km away', sellerName: 'Peter M.' },
            { id: 4, name: 'Fresh Vegetables', category: 'food', description: 'Spinach, kale, tomatoes', price: '$5/bundle', location: '500m away', sellerName: 'Auntie Rose' },
            { id: 5, name: 'Ploughing Service', category: 'services', description: 'Tractor ploughing per acre', price: '$10/acre', location: '3km away', sellerName: 'Tractor Co-op' },
            { id: 6, name: 'Moringa Leaves', category: 'herbs', description: 'Dried organic moringa 1kg', price: '$5', location: '1km away', sellerName: 'Herbalist Jane' }
        ];

        renderMarketItems(sampleItems);
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
                            <span class="trust-badge">⭐ Trusted</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-full contact-seller-btn" data-item-id="${item.id}">
                        ${t('contactSeller') || 'Contact Seller'}
                    </button>
                </div>
            </article>
        `).join('');

        // Add event listeners to contact buttons
        document.querySelectorAll('.contact-seller-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.contact-seller-btn').dataset.itemId;
                const item = items.find(i => i.id == itemId);
                if (item) {
                    showContactDialog(item);
                }
            });
        });
    }

    function showContactDialog(item) {
        const contactMethod = confirm(`Contact ${item.sellerName} about "${item.name}"?\n\nClick OK for SMS, Cancel for Call`);
        
        if (contactMethod) {
            // Simulate SMS
            showToast(`Opening SMS to ${item.sellerName}...`, 'info');
            setTimeout(() => {
                showToast(`Message template: "Hi ${item.sellerName}, I'm interested in your ${item.name} listed on Sinyoro."`, 'success', 5000);
            }, 1000);
        } else {
            // Simulate Call
            showToast(`Calling ${item.sellerName}...`, 'info');
        }
    }

    // ==========================================
    // FORM SUBMISSION
    // ==========================================
    const postItemForm = document.getElementById('postItemForm');
    
    if (postItemForm) {
        postItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(postItemForm);
            const itemData = {
                id: Date.now(),
                name: formData.get('title'),
                category: formData.get('category'),
                price: formData.get('price'),
                location: formData.get('location') || 'Unknown location',
                description: formData.get('description'),
                sellerName: formData.get('seller'),
                contactMethod: formData.get('contactMethod'),
                image: imagePreview?.src || null
            };

            // Validation
            if (!itemData.name || !itemData.category || !itemData.price) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            // Save to localStorage (simulating offline storage)
            saveItemLocally(itemData);
            
            // Show success message
            showToast('Item posted successfully!', 'success');
            
            // Close modal and reset
            closeModal();
            
            // Refresh my items display
            loadMyItems();
            
            // If we're in the same category, refresh market view
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category;
            if (activeFilter === 'all' || activeFilter === itemData.category) {
                const currentItems = getStoredItems();
                renderMarketItems(currentItems.filter(i => i.category === itemData.category || activeFilter === 'all'));
            }
        });
    }

    function saveItemLocally(item) {
        let items = JSON.parse(localStorage.getItem('sinyoro-items') || '[]');
        items.unshift(item); // Add to beginning
        localStorage.setItem('sinyoro-items', JSON.stringify(items));
    }

    function getStoredItems() {
        return JSON.parse(localStorage.getItem('sinyoro-items') || '[]');
    }

    // ==========================================
    // MY ITEMS MANAGEMENT
    // ==========================================
    function loadMyItems() {
        const myItemsList = document.getElementById('myItemsList');
        if (!myItemsList) return;

        const items = getStoredItems();
        
        if (items.length === 0) {
            myItemsList.innerHTML = `
                <div class="glass-card empty-state" id="emptyState">
                    <div class="empty-icon">📭</div>
                    <h3>${t('noItemsTitle') || 'No Items Yet'}</h3>
                    <p>${t('noItemsDesc') || 'Start selling by posting your first item to the marketplace.'}</p>
                    <button class="btn btn-primary" id="postFirstItemBtn" type="button">
                        ${t('postItem') || 'Post Item'}
                    </button>
                </div>
            `;
            document.getElementById('postFirstItemBtn')?.addEventListener('click', openModal);
        } else {
            myItemsList.innerHTML = items.map(item => `
                <div class="glass-card my-item-card" data-item-id="${item.id}">
                    <div class="my-item-header">
                        <h4>${item.name}</h4>
                        <span class="category-tag">${item.category}</span>
                    </div>
                    <p class="my-item-price">${item.price}</p>
                    <p class="my-item-location">📍 ${item.location}</p>
                    <div class="my-item-actions">
                        <button class="btn btn-secondary btn-small edit-item-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-secondary btn-small delete-item-btn" data-id="${item.id}" style="color: #ef4444;">Delete</button>
                    </div>
                </div>
            `).join('');

            // Add delete handlers
            document.querySelectorAll('.delete-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    deleteItem(id);
                });
            });
        }
    }

    function deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        let items = getStoredItems();
        items = items.filter(item => item.id !== id);
        localStorage.setItem('sinyoro-items', JSON.stringify(items));
        
        showToast('Item deleted', 'success');
        loadMyItems();
    }

    // ==========================================
    // LOAD MORE BUTTON
    // ==========================================
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            showToast('Loading more items...', 'loading', 2000);
            setTimeout(() => {
                showToast('No more items available', 'info');
            }, 2000);
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    updateConnectionStatus();
    loadMarketItems();
    loadMyItems();

    console.log('Sinyoro app initialized successfully!');
}
