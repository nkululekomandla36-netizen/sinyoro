/* ======================================================
   SINYORO APP.JS (FIXED & STABLE)
====================================================== */

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
  toast.style.background = "#111";
  toast.style.color = "#fff";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* -----------------------------
   CONNECTION STATUS (FIXED)
----------------------------- */
function checkConnection() {
  const dot = document.getElementById("connectionStatus");
  const text = document.getElementById("statusText");
  if (!dot || !text) return;

  if (navigator.onLine) {
    dot.style.background = "#22c55e";
    text.textContent = "Online";
  } else {
    dot.style.background = "#f97316";
    text.textContent = "Offline mode";
  }
}

/* -----------------------------
   LANGUAGE HANDLING (FIXED)
----------------------------- */
function setLanguage(lang) {
  currentLanguage = lang;

  if (window.TRANSLATIONS && TRANSLATIONS[lang]) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (TRANSLATIONS[lang][key]) {
        el.textContent = TRANSLATIONS[lang][key];
      }
    });

    const label = document.querySelector(".current-lang");
    if (label) label.textContent = TRANSLATIONS[lang].languageName || lang;
  }
}

/* -----------------------------
   GPS & LOCATION (HARDENED)
----------------------------- */
async function captureLocation() {
  if (!window.SinyoroLocation) {
    showToast("Location system not ready");
    return;
  }

  try {
    showToast("Capturing location...");
    currentUserLocation = await window.SinyoroLocation.captureGPS();
    showToast("Location saved");
  } catch (err) {
    console.warn("GPS failed, using last known");
    currentUserLocation =
      window.SinyoroLocation.getLastKnownPosition?.() || null;
    showToast("Using last known location");
  }
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
    price: data.price || null,
    location: currentUserLocation,
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
  try {
    marketItems = JSON.parse(localStorage.getItem("sinyoro_market_items")) || [];
  } catch {
    marketItems = [];
  }
}

/* -----------------------------
   DISTANCE
----------------------------- */
function calculateDistance(itemLocation) {
  if (!currentUserLocation || !itemLocation || !window.SinyoroLocation) return null;
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

  marketItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "market-card";

    const distance = calculateDistance(item.location);
    const distanceText = distance
      ? `${distance.toFixed(1)} km away`
      : "Distance unknown";

    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description || ""}</p>
      <strong>${distanceText}</strong>
    `;
    container.appendChild(card);
  });
}

/* -----------------------------
   INIT (SAFE & ORDERED)
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  checkConnection();
  window.addEventListener("online", checkConnection);
  window.addEventListener("offline", checkConnection);

  loadItemsOffline();
  renderMarketItems();

  document
    .getElementById("captureLocationBtn")
    ?.addEventListener("click", captureLocation);

  const form = document.getElementById("postItemForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      showToast("Posting disabled in demo");
    });
  }

  // 🌍 Language dropdown (FIXED)
  const btn = document.getElementById("languageBtn");
  const menu = document.getElementById("langDropdown");

  if (btn && menu) {
    menu.classList.remove("open");

    btn.addEventListener("click", e => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });

    menu.querySelectorAll(".lang-option").forEach(opt => {
      opt.addEventListener("click", () => {
        setLanguage(opt.dataset.lang);
        menu.classList.remove("open");
      });
    });

    document.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  }

  setLanguage(currentLanguage);
});
