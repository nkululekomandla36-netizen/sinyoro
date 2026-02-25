/* ======================================================
   SINYORO APP.JS
   Fully Fixed Main Application Logic
   (UI + Market + GPS + Language + Connection)
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
  if (currentLangEl) {
    currentLangEl.textContent = TRANSLATIONS?.[lang]?.languageName || lang;
  }
}

/* -----------------------------
   GPS & LOCATION (SAFE)
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
    console.warn("GPS failed, using last known location");
    currentUserLocation =
      window.SinyoroLocation.getLastKnownPosition?.() || null;

    if (currentUserLocation) {
      showToast("Using last known location");
    } else {
      showToast("Location unavailable");
    }
  }
}

/* -----------------------------
   CONNECTION STATUS (SAFE)
----------------------------- */
function updateConnectionUI() {
  const statusDot = document.getElementById("connectionStatus");
  const statusText = document.getElementById("statusText");
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
   MARKET ITEM MODEL
----------------------------- */
function createMarketItem(data, manualLocationText = null) {
  return {
    id: Date.now(),
    title: data.title,
    category: data.category,
    description: data.description || "",
    price: data.price || null,
    image: null,
    location:
      currentUserLocation && typeof currentUserLocation === "object"
        ? currentUserLocation
        : manualLocationText
        ? { notes: manualLocationText }
        : null,
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
    showToast("Capture GPS or enter location");
    return;
  }

  const item = createMarketItem(
    { title, category, description, price },
    manualLocation
  );

  marketItems.push(item);
  saveItemsOffline();
  renderMarketItems();
  form.reset();
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
    try {
      marketItems = JSON.parse(saved);
    } catch {
      marketItems = [];
    }
  }
}

/* -----------------------------
   DISTANCE SAFE CALCULATION
----------------------------- */
function calculateDistance(itemLocation) {
  if (
    !currentUserLocation ||
    !itemLocation ||
    typeof itemLocation !== "object" ||
    !itemLocation.latitude
  ) return null;

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

  const sorted = [...marketItems].sort((a, b) => {
    const da = calculateDistance(a.location) ?? Infinity;
    const db = calculateDistance(b.location) ?? Infinity;
    return da - db;
  });

  sorted.forEach(item => {
    const card = document.createElement("div");
    card.className = "market-card";

    const distance = calculateDistance(item.location);
    const distanceText = distance
      ? `${distance.toFixed(1)} km away`
      : item.location?.notes
      ? `📍 ${item.location.notes}`
      : "Location unknown";

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
   INIT APP (SAFE ORDER)
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Connection
  updateConnectionUI();
  window.addEventListener("online", updateConnectionUI);
  window.addEventListener("offline", updateConnectionUI);

  // Load data
  loadItemsOffline();
  renderMarketItems();

  // GPS button
  const locationBtn = document.getElementById("captureLocationBtn");
  if (locationBtn) locationBtn.addEventListener("click", captureLocation);

  // Form
  const addItemForm = document.getElementById("postItemForm");
  if (addItemForm) {
    addItemForm.addEventListener("submit", e => {
      e.preventDefault();
      handleAddItem(addItemForm);
    });
  }

  // Language dropdown (FIXED)
  const languageBtn = document.getElementById("languageBtn");
  const langDropdown = document.getElementById("langDropdown");

  if (languageBtn && langDropdown) {
    langDropdown.classList.remove("open");

    languageBtn.addEventListener("click", e => {
      e.stopPropagation();
      langDropdown.classList.toggle("open");
    });

    langDropdown.querySelectorAll(".lang-option").forEach(btn => {
      btn.addEventListener("click", () => {
        setLanguage(btn.dataset.lang);
        langDropdown.classList.remove("open");
      });
    });

    document.addEventListener("click", () => {
      langDropdown.classList.remove("open");
    });
  }

  setLanguage(currentLanguage);
});

console.log("✅ Sinyoro app.js fully loaded and stable");
