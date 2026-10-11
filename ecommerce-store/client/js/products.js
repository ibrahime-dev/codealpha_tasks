"use strict";

// ── Static product catalogue (used as fallback when API is offline) ───────────
const STATIC_PRODUCTS = [
  { id: "1",  name: "Minimal Classic Watch",        category: "Accessories", price: 49.99, image: "images/watch.jpg",        badge: "Popular" },
  { id: "2",  name: "Everyday Sneakers",             category: "Fashion",     price: 64.99, image: "images/sneakers.jpg",     badge: "New"     },
  { id: "3",  name: "Studio Wireless Headphones",   category: "Electronics", price: 89.99, image: "images/headphones.jpg",   badge: "Popular" },
  { id: "4",  name: "Modern Ambient Lamp",           category: "Home",        price: 39.99, image: "images/lamp.jpg",         badge: ""        },
  { id: "5",  name: "Wireless Earbuds",              category: "Electronics", price: 29.99, image: "images/earbuds.jpg",      badge: "New"     },
  { id: "6",  name: "Digital Camera",               category: "Electronics", price: 199.99,image: "images/camera.jpg",       badge: ""        },
  { id: "7",  name: "Bluetooth Speaker",            category: "Electronics", price: 39.99, image: "images/speaker.jpg",      badge: ""        },
  { id: "8",  name: "Premium Headphones",           category: "Electronics", price: 59.99, image: "images/head-phones.jpg",  badge: ""        },
  { id: "9",  name: "Smartwatch",                   category: "Electronics", price: 79.99, image: "images/smartwatch.jpg",   badge: "Popular" },
  { id: "10", name: "Smartwatch Series",            category: "Electronics", price: 89.99, image: "images/smartwatchs.jpg",  badge: ""        },
  { id: "11", name: "Running Sneakers",             category: "Fashion",     price: 59.99, image: "images/sneakers-a.jpg",   badge: ""        },
  { id: "12", name: "Running Shoes",                category: "Fashion",     price: 74.99, image: "images/running-shoes.jpg",badge: ""        },
  { id: "13", name: "Casual T-shirt",               category: "Fashion",     price: 19.99, image: "images/tshirt.jpg",       badge: ""        },
  { id: "14", name: "Leather Handbag",              category: "Accessories", price: 44.99, image: "images/handbag.jpg",      badge: "Popular" },
  { id: "15", name: "Fashion Handbag",              category: "Accessories", price: 49.99, image: "images/handbags.jpg",     badge: ""        },
  { id: "16", name: "Coffee Mug",                   category: "Home",        price: 12.99, image: "images/mug.jpg",          badge: ""        }
];

// ── DOM refs ──────────────────────────────────────────────────────────────────

const grid           = document.getElementById("productsGrid");
const searchInput    = document.getElementById("productSearch");
const sortSelect     = document.getElementById("sortProducts");
const resultsCount   = document.getElementById("resultsCount");
const emptyState     = document.getElementById("emptyState");
const categoryFilters = document.getElementById("categoryFilters");

let allProducts     = [];   // filled from API or fallback
let selectedCategory = "All";

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(amount) {
  return "$" + Number(amount).toFixed(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function localCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch { return []; }
}

function updateCartBadge() {
  const count = localCart().reduce((t, i) => t + (Number(i.quantity) || 0), 0);
  document.querySelectorAll("#cartCount").forEach((el) => { el.textContent = count; });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function addToCart(productId) {
  const product = allProducts.find((p) => String(p.id) === String(productId));
  if (!product) return;

  const cart     = localCart();
  const existing = cart.find((i) => String(i.id) === String(product.id));

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + 1;
  } else {
    cart.push({
      id:       String(product.id),
      name:     product.name,
      price:    product.price,
      image:    product.image || "",
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  showToast(`${product.name} added to your bag!`);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderProducts() {
  if (!grid) return;

  const query = (searchInput?.value || "").trim().toLowerCase();
  const sort  = sortSelect?.value || "featured";

  let filtered = allProducts.filter((p) => {
    const matchCat    = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(query) ||
                        p.category.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  if (sort === "price-low")  filtered.sort((a, b) => a.price - b.price);
  else if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
  else if (sort === "name")  filtered.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = filtered.map((product) => {
    const badge = product.badge || (product.featured ? "Featured" : "");
    return `
    <article class="product-card">
      <div class="product-image">
        ${badge ? `<span class="product-badge${badge === "New" ? " badge-new" : ""}">${escapeHTML(badge)}</span>` : ""}
        <button class="wishlist-button" type="button"
          aria-label="Add ${escapeHTML(product.name)} to favorites"
          aria-pressed="false">♡</button>
        <a href="product-details.html?id=${encodeURIComponent(product.id)}"
          class="product-image-link"
          aria-label="View ${escapeHTML(product.name)}">
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}"
               loading="lazy"
               onerror="this.onerror=null;this.src='images/watch.jpg';this.alt='Image unavailable';">
        </a>
        <button type="button" class="quick-add"
          data-add-id="${escapeHTML(String(product.id))}"
          aria-label="Add ${escapeHTML(product.name)} to cart">Add to Cart</button>
      </div>
      <div class="product-info">
        <span class="product-category">
          ${product.category === "Home" ? "Home &amp; Living" : escapeHTML(product.category)}
        </span>
        <h3>
          <a href="product-details.html?id=${encodeURIComponent(product.id)}">
            ${escapeHTML(product.name)}
          </a>
        </h3>
        <div class="product-bottom">
          <strong>${money(product.price)}</strong>
        </div>
      </div>
    </article>`;
  }).join("");

  if (resultsCount) {
    resultsCount.textContent =
      `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
  }

  if (emptyState) emptyState.hidden = filtered.length > 0;
  grid.hidden = filtered.length === 0;
}

// ── Load products (API first, static fallback) ────────────────────────────────

async function loadProducts(category) {
  if (grid) grid.innerHTML = `<p class="loading-text">Loading products…</p>`;

  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);

  // Try the API
  const { ok, data } = await apiFetch(`/products?${params.toString()}`);

  if (ok && Array.isArray(data.products) && data.products.length > 0) {
    // Normalise API product shape to match what the rest of the JS expects
    allProducts = data.products.map((p) => ({
      id:       String(p._id),
      name:     p.name,
      category: p.category,
      price:    p.price,
      image:    p.image,
      badge:    p.featured ? "Featured" : "",
      stock:    p.stock
    }));
  } else {
    // Fall back to static catalogue
    allProducts = category && category !== "All"
      ? STATIC_PRODUCTS.filter((p) => p.category === category)
      : [...STATIC_PRODUCTS];
  }

  renderProducts();
}

// ── Event listeners ───────────────────────────────────────────────────────────

categoryFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  selectedCategory = button.dataset.category;

  categoryFilters.querySelectorAll("[data-category]").forEach((btn) => {
    const active = btn === button;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  renderProducts();
});

searchInput?.addEventListener("input", renderProducts);
sortSelect?.addEventListener("change", renderProducts);

grid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-id]");
  if (button) addToCart(button.dataset.addId);
});

document.getElementById("resetFilters")?.addEventListener("click", () => {
  selectedCategory = "All";
  if (searchInput) searchInput.value = "";
  if (sortSelect)  sortSelect.value  = "featured";

  categoryFilters?.querySelectorAll("[data-category]").forEach((btn) => {
    const active = btn.dataset.category === "All";
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  renderProducts();
});

document.getElementById("menuToggle")?.addEventListener("click", () => {
  const nav    = document.getElementById("mainNav");
  const toggle = document.getElementById("menuToggle");
  if (!nav || !toggle) return;
  const opened = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(opened));
  toggle.textContent = opened ? "✕" : "☰";
});

// ── Boot ──────────────────────────────────────────────────────────────────────

const yearEl = document.getElementById("currentYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Read category from URL (e.g. products.html?category=Electronics)
const urlCategory = new URLSearchParams(window.location.search).get("category");
const validCategories = ["Fashion", "Electronics", "Accessories", "Home"];

if (urlCategory && validCategories.includes(urlCategory)) {
  selectedCategory = urlCategory;

  categoryFilters?.querySelectorAll("[data-category]").forEach((btn) => {
    const active = btn.dataset.category === selectedCategory;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

updateCartBadge();

// api.js is loaded before this script so apiFetch / initNavAuth are available
if (typeof initNavAuth === "function") initNavAuth();

loadProducts(selectedCategory);
