// ==========================================
// LOCATION SYSTEM INTEGRATION
// ADD THIS CODE TO YOUR app.js FILE
// ==========================================

// Add this after the init check for translations, around line 20

let currentItemLocation = null;

// ==========================================
// GPS CAPTURE BUTTON
// ==========================================
const captureGPSBtn = document.getElementById('captureGPSBtn');
const gpsStatus = document.getElementById('gpsStatus');
const gpsResult = document.getElementById('gpsResult');
const retryGPSBtn = document.getElementById('retryGPSBtn');

if (captureGPSBtn) {
    captureGPSBtn.addEventListener('click', handleGPSCapture);
}

if (retryGPSBtn) {
    retryGPSBtn.addEventListener('click', handleGPSCapture);
}

function handleGPSCapture() {
    if (!window.SinyoroLocation) {
        showToast('Location system not loaded', 'error');
        return;
    }

    // Show loading state
    if (gpsStatus) {
        gpsStatus.style.display = 'block';
        gpsStatus.querySelector('.status-text').textContent = 'Searching for GPS signal...';
    }
    if (gpsResult) gpsResult.style.display = 'none';
    if (captureGPSBtn) captureGPSBtn.disabled = true;

    // Capture GPS
    window.SinyoroLocation.captureGPS()
        .then(location => {
            console.log('📍 GPS captured:', location);
            currentItemLocation = location;

            // Hide status, show result
            if (gpsStatus) gpsStatus.style.display = 'none';
            if (gpsResult) {
                gpsResult.style.display = 'block';
                
                // Update result display
                const accuracyEl = document.getElementById('gpsAccuracy');
                const coordsEl = document.getElementById('gpsCoords');
                
                if (accuracyEl) {
                    accuracyEl.textContent = `±${location.accuracy}m`;
                }
                if (coordsEl) {
                    coordsEl.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
                }

                // Show status indicator
                const statusInfo = window.SinyoroLocation.showGPSStatus(location.accuracy, location.source);
                gpsResult.querySelector('.result-text').textContent = statusInfo.status;
            }

            if (captureGPSBtn) captureGPSBtn.disabled = false;
            
            // Show success toast
            if (location.source === 'last_known') {
                showToast('Using last known location', 'warning');
            } else {
                showToast('GPS location captured!', 'success');
            }
        })
        .catch(error => {
            console.error('❌ GPS capture failed:', error);
            
            // Hide loading, show error
            if (gpsStatus) {
                gpsStatus.style.display = 'block';
                const statusEl = gpsStatus.querySelector('.status-text');
                const detailsEl = gpsStatus.querySelector('.status-details');
                
                if (statusEl) statusEl.textContent = 'GPS unavailable';
                if (detailsEl) {
                    detailsEl.innerHTML = `
                        <p>Could not get GPS signal.</p>
                        <p>You can still use landmarks!</p>
                    `;
                }
            }
            
            if (captureGPSBtn) captureGPSBtn.disabled = false;
            
            showToast('GPS unavailable - use landmark instead', 'warning', 4000);
        });
}

// ==========================================
// FORM SUBMISSION WITH LOCATION
// ==========================================
// MODIFY YOUR EXISTING postItemForm.addEventListener('submit') function
// Add this code after line: const item = { ... }

if (postItemForm) {
    postItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ... (keep your existing code to get item data)
        
        const itemName = document.getElementById('itemName')?.value.trim();
        const category = document.getElementById('itemCategory')?.value;
        const description = document.getElementById('itemDescription')?.value.trim();
        const price = document.getElementById('itemPrice')?.value.trim();
        const sellerName = document.getElementById('sellerName')?.value.trim();
        const contactMethod = document.getElementById('contactMethod')?.value;
        const imageData = imagePreview?.src || null;

        // ✅ NEW: Get location data
        const landmark = document.getElementById('itemLandmark')?.value.trim() || '';
        const area = document.getElementById('itemArea')?.value.trim() || '';
        const locationNotes = document.getElementById('itemLocationNotes')?.value.trim() || '';

        if (!itemName || !category || !description || !price || !sellerName) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        // Validate location (at least one must be provided)
        if (!currentItemLocation && !landmark && !area) {
            showToast('Please provide GPS, landmark, or area', 'warning');
            return;
        }

        const loadingToast = showToast(editingItemId ? 'Updating item...' : 'Posting item...', 'loading', 0);

        // ✅ Create location object
        let locationData = null;
        if (currentItemLocation || landmark || area) {
            locationData = window.SinyoroLocation.createLocationObject({
                latitude: currentItemLocation?.latitude,
                longitude: currentItemLocation?.longitude,
                accuracy: currentItemLocation?.accuracy,
                source: currentItemLocation?.source || 'manual',
                landmark: landmark,
                area_name: area,
                notes: locationNotes
            });
        }

        const item = {
            name: itemName,
            category: category,
            description: description,
            price: price,
            location: locationData, // ✅ NEW: Add location
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

        // ... (keep your existing database save code)

        if (db) {
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = editingItemId ? store.put(item) : store.add(item);

            request.onsuccess = () => {
                removeToast(loadingToast);
                showToast(editingItemId ? 'Item updated!' : 'Item posted!', 'success');
                closeModal();
                postItemForm.reset();
                currentItemLocation = null; // Reset location
                updateMyItemsSection();
                updateMarketDisplay(); // ✅ NEW: Update market to show distances
            };

            request.onerror = () => {
                removeToast(loadingToast);
                showToast('Failed to save item', 'error');
            };
        }
    });
}

// ==========================================
// UPDATE MARKET DISPLAY WITH DISTANCES
// ==========================================
function updateMarketDisplay() {
    if (!db || !window.SinyoroLocation) return;

    const userLocation = window.SinyoroLocation.getCurrentPosition() || 
                        window.SinyoroLocation.getLastKnownPosition();
    
    if (!userLocation) {
        console.log('📍 No user location available for distance calculation');
        loadMarketItems(); // Just load normally
        return;
    }

    const transaction = db.transaction(['items'], 'readonly');
    const store = transaction.objectStore('items');
    const request = store.getAll();

    request.onsuccess = () => {
        let items = request.result;
        
        // Sort by distance
        items = window.SinyoroLocation.sortByDistance(items, userLocation);
        
        // Update market cards with distance
        items.forEach(item => {
            updateCardDistance(item, userLocation);
        });
        
        console.log('✅ Market updated with distances');
    };
}

function updateCardDistance(item, userLocation) {
    const card = document.querySelector(`.market-card[data-item-id="${item.id}"]`);
    if (!card || !item.location) return;

    const distanceTag = card.querySelector('.distance-tag');
    if (!distanceTag) return;

    if (item.location.latitude && item.location.longitude && userLocation) {
        const distance = window.SinyoroLocation.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.location.latitude,
            item.location.longitude
        );
        
        const distanceText = window.SinyoroLocation.formatDistance(distance);
        const valueEl = distanceTag.querySelector('.distance-value');
        if (valueEl) {
            valueEl.textContent = distanceText;
        }

        // Add nearby class if < 2km
        if (distance && distance < 2) {
            distanceTag.classList.add('nearby');
        }
    } else if (item.location.landmark) {
        const valueEl = distanceTag.querySelector('.distance-value');
        if (valueEl) {
            valueEl.textContent = `📍 ${item.location.landmark}`;
        }
    }
}

// ==========================================
// CLOSE MODAL - RESET LOCATION
// ==========================================
// MODIFY your existing closeModal function to add:

function closeModal() {
    if (!postItemModal) return;
    postItemModal.hidden = true;
    document.body.style.overflow = '';
    editingItemId = null;
    currentItemLocation = null; // ✅ NEW: Reset location
    document.getElementById('postItemForm')?.reset();
    clearImagePreview();
    
    // ✅ NEW: Hide GPS UI
    if (gpsStatus) gpsStatus.style.display = 'none';
    if (gpsResult) gpsResult.style.display = 'none';
}

// ==========================================
// CAPTURE GPS ON PAGE LOAD (Optional)
// ==========================================
// Uncomment this to automatically capture user's location on load
/*
window.addEventListener('load', () => {
    if (window.SinyoroLocation) {
        window.SinyoroLocation.captureGPS()
            .then(location => {
                console.log('📍 User location captured on load');
                updateMarketDisplay();
            })
            .catch(err => {
                console.log('📍 Could not get user location on load');
            });
    }
});
*/

console.log('✅ Location integration complete');
