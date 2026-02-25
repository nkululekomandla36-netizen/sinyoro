/* ======================================================
   SINYORO APP.JS
   Main Application Logic (UI + Market + GPS + Language + Connection + Auto Distance)
====================================================== */

/* -----------------------------
   GLOBAL STATE
----------------------------- */
let currentLanguage = "en";
let currentUserLocation = null;
let currentItemLocation = null;
let marketItems = [];

/* -----------------------------
   UTILITIES
----------------------------- */
function showToast(message, duration = 3000) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function clearImagePreview() {
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const itemImageInput = document.getElementById('itemImage');
  if (itemImageInput) itemImageInput.value = '';
  if (imagePreview) imagePreview.src = '';
  if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
}

/* -----------------------------
   CONNECTION STATUS
----------------------------- */
const statusDot = document.getElementById("connectionStatus");
const statusText = document.getElementById("statusText");
function checkConnection() {
  if (!statusDot || !statusText) return;
  if (navigator.onLine) {
    statusDot.style.backgroundColor = "green";
    statusText.textContent = "Online";
  } else {
    statusDot.style.backgroundColor = "orange";
    statusText.textContent = "Offline mode";
  }
}

/* -----------------------------
   LANGUAGE HANDLING
----------------------------- */
function setLanguage(lang) {
  currentLanguage = lang;
  if (window.TRANSLATIONS && TRANSLATIONS[lang]) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (TRANSLATIONS[lang][key]) el.textContent = TRANSLATIONS[lang][key];
    });
  }
  const currentLangEl = document.querySelector(".current-lang");
  if (currentLangEl) currentLangEl.textContent = TRANSLATIONS[lang]?.languageName || lang;
}

/* -----------------------------
   GPS & LOCATION
----------------------------- */
async function captureLocation() {
  try {
    showToast("Capturing location...");
    currentUserLocation = await window.SinyoroLocation.captureGPS();
    showToast("Location saved");
    renderMarketItems(); // Re-render to update distances
  } catch (err) {
    console.error(err);
    showToast("Using last known location");
    currentUserLocation = window.SinyoroLocation.getLastKnownLocation();
    renderMarketItems(); // Re-render to update distances
  }
}

/* -----------------------------
   MARKET ITEM MODEL
----------------------------- */
function createMarketItem(data, manualLocation = null) {
  return {
    id: Date.now(),
    title: data.title,
    category: data.category,
    description: data.description || "",
    price: data.price || null,
    image: data.image || null,
    location: currentUserLocation || currentItemLocation || manualLocation || null,
    createdAt: new Date().toISOString()
  };
}

/* -----------------------------
   OFFLINE STORAGE
----------------------------- */
function saveItemsOffline() {
  localStorage.setItem("sinyoro_market_items", JSON.stringify(marketItems));
}
function loadItemsOffline() {
  const saved = localStorage.getItem("sinyoro_market_items");
  if (saved) {
    try { marketItems = JSON.parse(saved); } catch { marketItems = []; }
  }
}

/* -----------------------------
   DISTANCE HELPERS
----------------------------- */
function calculateDistance(itemLocation) {
  if (!currentUserLocation || !itemLocation?.latitude || !itemLocation?.longitude) return null;
  return window.SinyoroLocation.calculateDistance(
    currentUserLocation.latitude,
    currentUserLocation.longitude,
    itemLocation.latitude,
    itemLocation.longitude
  );
}

/* -----------------------------
   IMAGE PREVIEW LOGIC
----------------------------- */
const itemImageInput = document.getElementById('itemImage');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');

if (itemImageInput) {
  itemImageInput.addEventListener('change', () => {
    const file = itemImageInput.files[0];
    if (!file) return;
    imagePreview.src = URL.createObjectURL(file);
    imagePreviewContainer.style.display = 'block';
  });
}
if (removeImageBtn) removeImageBtn.addEventListener('click', clearImagePreview);

/* -----------------------------
   RENDER MARKET WITH DISTANCE SORT
----------------------------- */
function renderMarketItems() {
  const container = document.getElementById("marketGrid");
  if (!container) return;

  container.innerHTML = "";
  
  // Sort items by distance if GPS available
  const sortedItems = [...marketItems].sort((a,b) => {
    const dA = calculateDistance(a.location) ?? Infinity;
    const dB = calculateDistance(b.location) ?? Infinity;
    return dA - dB;
  });

  sortedItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "market-card";
    card.setAttribute('data-item-id', item.id);

    const distance = calculateDistance(item.location);
    let distanceText = distance ? `${distance.toFixed(1)} km away` : "Distance unknown";
    const nearbyClass = (distance && distance < 2) ? 'nearby' : '';

    card.innerHTML = `
      <h3>${item.title}</h3>
      <p><strong>Category:</strong> ${item.category}</p>
      <p>${item.description || ""}</p>
      <p class="distance-tag ${nearbyClass}"><span class="distance-value">${distanceText}</span></p>
    `;
    container.appendChild(card);
  });
}

/* -----------------------------
   GPS CAPTURE BUTTON
----------------------------- */
const captureGPSBtn = document.getElementById('captureGPSBtn');
const gpsStatus = document.getElementById('gpsStatus');
const gpsResult = document.getElementById('gpsResult');
const retryGPSBtn = document.getElementById('retryGPSBtn');

function handleGPSCapture() {
  if (!window.SinyoroLocation) return showToast('Location system not loaded', 3000);
  if (gpsStatus) {
    gpsStatus.style.display = 'block';
    gpsStatus.querySelector('.status-text').textContent = 'Searching for GPS signal...';
  }
  if (gpsResult) gpsResult.style.display = 'none';
  if (captureGPSBtn) captureGPSBtn.disabled = true;

  window.SinyoroLocation.captureGPS()
    .then(location => {
      console.log('📍 GPS captured:', location);
      currentItemLocation = location;
      if (gpsStatus) gpsStatus.style.display = 'none';
      if (gpsResult) {
        gpsResult.style.display = 'block';
        const accuracyEl = document.getElementById('gpsAccuracy');
        const coordsEl = document.getElementById('gpsCoords');
        if (accuracyEl) accuracyEl.textContent = `±${location.accuracy}m`;
        if (coordsEl) coordsEl.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      }
      if (captureGPSBtn) captureGPSBtn.disabled = false;
      showToast(location.source === 'last_known' ? 'Using last known location' : 'GPS location captured!', 3000);
      renderMarketItems(); // Update distances
    })
    .catch(err => {
      console.error('❌ GPS capture failed:', err);
      if (gpsStatus) {
        gpsStatus.style.display = 'block';
        gpsStatus.querySelector('.status-text').textContent = 'GPS unavailable';
      }
      if (gpsResult) gpsResult.style.display = 'none';
      if (captureGPSBtn) captureGPSBtn.disabled = false;
      showToast('GPS unavailable - use landmark or area', 4000);
    });
}

if (captureGPSBtn) captureGPSBtn.addEventListener('click', handleGPSCapture);
if (retryGPSBtn) retryGPSBtn.addEventListener('click', handleGPSCapture);

/* -----------------------------
   POST ITEM FORM
----------------------------- */
const postItemForm = document.getElementById('postItemForm');
if (postItemForm) {
  postItemForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('itemTitle')?.value.trim();
    const category = document.getElementById('itemCategory')?.value;
    const description = document.getElementById('itemDescription')?.value.trim();
    const price = document.getElementById('itemPrice')?.value.trim();
    const imageData = imagePreview?.src || null;
    const landmark = document.getElementById('itemLandmark')?.value.trim() || '';
    const area = document.getElementById('itemArea')?.value.trim() || '';
    if (!title || !category) return showToast('Please fill title and category', 3000);
    if (!currentItemLocation && !landmark && !area) return showToast('Provide GPS, landmark or area', 3000);

    const item = createMarketItem({ title, category, description, price, image: imageData });
    marketItems.push(item);
    saveItemsOffline();
    renderMarketItems();

    postItemForm.reset();
    clearImagePreview();
    if (gpsStatus) gpsStatus.style.display = 'none';
    if (gpsResult) gpsResult.style.display = 'none';
    currentItemLocation = null;
    showToast('Item posted successfully!', 3000);
  });
}

/* -----------------------------
   INIT APP
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  checkConnection();
  window.addEventListener("online", checkConnection);
  window.addEventListener("offline", checkConnection);

  loadItemsOffline();
  renderMarketItems();

  const locationBtn = document.getElementById("captureLocationBtn");
  if (locationBtn) locationBtn.addEventListener("click", captureLocation);

  const languageBtn = document.getElementById("languageBtn");
  const langDropdown = document.getElementById("langDropdown");
  if (languageBtn && langDropdown) {
    langDropdown.hidden = true;
    languageBtn.addEventListener("click", () => {
      const expanded = languageBtn.getAttribute("aria-expanded") === "true";
      languageBtn.setAttribute("aria-expanded", !expanded);
      langDropdown.hidden = expanded;
    });
    langDropdown.querySelectorAll(".lang-option").forEach(btn => {
      btn.addEventListener("click", () => {
        setLanguage(btn.dataset.lang);
        langDropdown.querySelectorAll(".lang-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        languageBtn.setAttribute("aria-expanded", false);
        langDropdown.hidden = true;
      });
    });
  }

  setLanguage(currentLanguage);
});

console.log('✅ Sinyoro app.js loaded with auto distance sorting');
