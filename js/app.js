/* ======================================================
   SINYORO APP.JS
   Main Application Logic (UI + Market + GPS + Language + Connection)
====================================================== */

/* -----------------------------
   GLOBAL STATE
----------------------------- */
let currentLanguage = "en";
let currentUserLocation = null;
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
      if (TRANSLATIONS[lang][key]) {
        el.textContent = TRANSLATIONS[lang][key];
      }
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
  } catch (err) {
    console.error(err);
    showToast("Using last known location");
    currentUserLocation = window.SinyoroLocation.getLastKnownLocation();
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
    location: currentUserLocation || manualLocation || null,
    createdAt: new Date().toISOString()
  };
}

/* -----------------------------
   ADD ITEM FLOW
----------------------------- */
function handleAddItem(form) {
  const title = form.querySelector("#itemTitle")?.value.trim();
  const category = form.querySelector("#itemCategory")?.value;
  const description = form.querySelector("#itemDescription")?.value.trim();
  const price = form.querySelector("#itemPrice")?.value;
  const manualLocation = form.querySelector("#itemLocation")?.value.trim();

  if (!title || !category) {
    showToast("Title and category required");
    return;
  }

  if (!currentUserLocation && !manualLocation) {
    showToast("Please capture location or enter manually");
    return;
  }

  const item = createMarketItem({ title, category, description, price }, manualLocation);
  marketItems.push(item);
  saveItemsOffline();
  renderMarketItems();
  form.reset();

  // Hide image preview if visible
  if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';

  showToast("Item posted successfully");
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
  if (!currentUserLocation || !itemLocation) return null;
  return window.SinyoroLocation.calculateDistance(
    currentUserLocation.latitude,
    currentUserLocation.longitude,
    itemLocation.latitude,
    itemLocation.longitude
  );
}

/* -----------------------------
   RENDER MARKET
----------------------------- */
function renderMarketItems() {
  const container = document.getElementById("marketGrid");
  if (!container) return;

  container.innerHTML = "";
  const sortedItems = [...marketItems].sort((a,b) => {
    const dA = calculateDistance(a.location) ?? Infinity;
    const dB = calculateDistance(b.location) ?? Infinity;
    return dA - dB;
  });

  sortedItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "market-card";
    const distance = calculateDistance(item.location);
    const distanceText = distance ? `${distance.toFixed(1)} km away` : "Distance unknown";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p><strong>Category:</strong> ${item.category}</p>
      <p>${item.description || ""}</p>
      <p><strong>${distanceText}</strong></p>
    `;
    container.appendChild(card);
  });
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
if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
        itemImageInput.value = '';
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    });
}

/* -----------------------------
   INIT APP
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Connection
  checkConnection();
  window.addEventListener("online", checkConnection);
  window.addEventListener("offline", checkConnection);

  // Load offline items
  loadItemsOffline();
  renderMarketItems();

  // Location button
  const locationBtn = document.getElementById("captureLocationBtn");
  if (locationBtn) locationBtn.addEventListener("click", captureLocation);

  // Post item form
  const addItemForm = document.getElementById("postItemForm");
  if (addItemForm) addItemForm.addEventListener("submit", e => {
    e.preventDefault();
    handleAddItem(addItemForm);
  });

  // Language dropdown
  const languageBtn = document.getElementById("languageBtn");
  const langDropdown = document.getElementById("langDropdown");
  if (languageBtn && langDropdown) {
    langDropdown.hidden = true; // start hidden
    languageBtn.addEventListener("click", () => {
      const expanded = languageBtn.getAttribute("aria-expanded") === "true";
      languageBtn.setAttribute("aria-expanded", !expanded);
      langDropdown.hidden = expanded;
    });

    langDropdown.querySelectorAll(".lang-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedLang = btn.dataset.lang;
        setLanguage(selectedLang);

        // update active state
        langDropdown.querySelectorAll(".lang-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // close dropdown
        languageBtn.setAttribute("aria-expanded", false);
        langDropdown.hidden = true;
      });
    });
  }

  // Initial language
  setLanguage(currentLanguage);
});
