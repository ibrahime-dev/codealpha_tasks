"use strict";

// ── Static product data (fallback when API is offline) ────────────────────────
// Covers IDs used in index.html (p101–p104) and products.html (1–16).
const STATIC_PRODUCTS = [
  { id: "p101", name: "Studio Wireless Headphones",  category: "Electronics", price: 79.00,  image: "images/headphones.jpg",  description: "Enjoy your favorite music with Studio Wireless Headphones. Designed for comfortable everyday listening, studying, working, and relaxing." },
  { id: "p102", name: "Everyday Classic Sneakers",   category: "Fashion",     price: 64.00,  image: "images/sneakers.jpg",     description: "Step out in style with Everyday Classic Sneakers. Their versatile design makes them a great choice for casual outfits and everyday adventures." },
  { id: "p103", name: "Minimal Ceramic Table Lamp",  category: "Home",        price: 48.00,  image: "images/lamp.jpg",         description: "Create a warm and welcoming atmosphere with this minimal ceramic table lamp. Its simple design complements bedrooms, living rooms, and workspaces." },
  { id: "p104", name: "Timeless Everyday Backpack",  category: "Fashion",     price: 55.00,  image: "images/handbags.jpg",     description: "Carry your everyday essentials with this stylish bag. A versatile accessory for work, shopping, and daily adventures." },
  { id: "1",  name: "Minimal Classic Watch",        category: "Accessories", price: 49.99,  image: "images/watch.jpg",        description: "A timeless everyday essential with a clean, versatile design." },
  { id: "2",  name: "Everyday Sneakers",             category: "Fashion",     price: 64.99,  image: "images/sneakers.jpg",     description: "Classic everyday sneakers built for all-day comfort and style." },
  { id: "3",  name: "Studio Wireless Headphones",   category: "Electronics", price: 89.99,  image: "images/headphones.jpg",   description: "Premium wireless audio for work and play." },
  { id: "4",  name: "Modern Ambient Lamp",           category: "Home",        price: 39.99,  image: "images/lamp.jpg",         description: "A soft, modern lamp to brighten any space." },
  { id: "5",  name: "Wireless Earbuds",              category: "Electronics", price: 29.99,  image: "images/earbuds.jpg",      description: "Compact wireless earbuds for on-the-go listening." },
  { id: "6",  name: "Digital Camera",               category: "Electronics", price: 199.99, image: "images/camera.jpg",       description: "Capture every moment in crisp detail." },
  { id: "7",  name: "Bluetooth Speaker",            category: "Electronics", price: 39.99,  image: "images/speaker.jpg",      description: "Portable speaker with rich, clear sound." },
  { id: "8",  name: "Premium Headphones",           category: "Electronics", price: 59.99,  image: "images/head-phones.jpg",  description: "Over-ear headphones for immersive listening." },
  { id: "9",  name: "Smartwatch",                   category: "Electronics", price: 79.99,  image: "images/smartwatch.jpg",   description: "Stay connected with a sleek smartwatch." },
  { id: "10", name: "Smartwatch Series",            category: "Electronics", price: 89.99,  image: "images/smartwatchs.jpg",  description: "Next-generation smartwatch with advanced health tracking." },
  { id: "11", name: "Running Sneakers",             category: "Fashion",     price: 59.99,  image: "images/sneakers-a.jpg",   description: "Lightweight running sneakers built for performance." },
  { id: "12", name: "Running Shoes",                category: "Fashion",     price: 74.99,  image: "images/running-shoes.jpg",description: "Supportive running shoes for every terrain." },
  { id: "13", name: "Casual T-shirt",               category: "Fashion",     price: 19.99,  image: "images/tshirt.jpg",       description: "A classic everyday tee in a relaxed fit." },
  { id: "14", name: "Leather Handbag",              category: "Accessories", price: 44.99,  image: "images/handbag.jpg",      description: "Genuine leather handbag with a timeless silhouette." },
  { id: "15", name: "Fashion Handbag",              category: "Accessories", price: 49.99,  image: "images/handbags.jpg",     description: "Modern handbag that pairs with any outfit." },
  { id: "16", name: "Coffee Mug",                   category: "Home",        price: 12.99,  image: "images/mug.jpg",          description: "A cosy mug for your morning ritual." }
];

// ── DOM refs ──────────────────────────────────────────────────────────────────

const imageElement       = document.getElementById("detailImage");
const nameElement        = document.getElementById("detailName");
const categoryElement    = document.getElementById("detailCategory");
const priceElement       = document.getElementById("detailPrice");
const descriptionElement = document.getElementById("detailDescription");
const breadcrumbElement  = document.getElementById("breadcrumbName");
const quantityInput      = document.getElementById("quantity");
const addButton          = document.getElementById("addToBag");
const availabilityEl     = document.querySelector(".detail-availability");

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCart() {
  try {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(c) ? c : [];
  } catch { return []; }
}

function updateCartCount() {
  const count = readCart().reduce((s, i) => s + Math.max(0, Number(i.quantity) || 0), 0);
  document.querySelectorAll("#cartCount, #cart-count").forEach((el) => {
    el.textContent = count;
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) { alert(message); return; }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function showMissingProduct() {
  const details = document.getElementById("productDetails");
  if (details) {
    details.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span>⌕</span>
        <h3>Product not found</h3>
        <p>The product may not exist or the link may be incorrect.</p>
        <a class="button button-primary" href="products.html">Browse products</a>
      </div>`;
  }
  document.title = "Product Not Found | ShopEase";
}

// ── Render ────────────────────────────────────────────────────────────────────

let currentProduct = null;

function renderProduct(item) {
  currentProduct = item;
  document.title = `${item.name} | ShopEase`;

  if (imageElement) {
    imageElement.src = item.image;
    imageElement.alt = item.name;
    imageElement.onerror = function () {
      this.onerror = null;
      this.alt = `${item.name} — image unavailable`;
    };
  }

  if (nameElement)        nameElement.textContent        = item.name;
  if (priceElement)       priceElement.textContent       = "$" + Number(item.price).toFixed(2);
  if (descriptionElement) descriptionElement.textContent = item.description || "";
  if (breadcrumbElement)  breadcrumbElement.textContent  = item.name;

  if (categoryElement) {
    categoryElement.textContent =
      item.category === "Home" ? "HOME & LIVING" : item.category.toUpperCase();
  }

  // Show stock status if we have it from the API
  if (availabilityEl && item.stock !== undefined) {
    if (item.stock === 0) {
      availabilityEl.innerHTML = `<span class="availability-dot out"></span><span>Out of stock</span>`;
      if (addButton) {
        addButton.disabled = true;
        addButton.textContent = "Out of stock";
      }
    } else if (item.stock <= 5) {
      availabilityEl.innerHTML = `<span class="availability-dot low"></span><span>Only ${item.stock} left</span>`;
    } else {
      availabilityEl.innerHTML = `<span class="availability-dot"></span><span>In stock</span>`;
    }
  }
}

// ── Add to cart ───────────────────────────────────────────────────────────────

function addProductToCart() {
  if (!currentProduct || !quantityInput) return;

  let quantity = Math.floor(Number(quantityInput.value));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    showToast("Please choose a quantity from 1 to 99.");
    quantityInput.value = "1";
    return;
  }

  const cart     = readCart();
  const existing = cart.find((i) => String(i.id) === String(currentProduct.id));

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + quantity;
  } else {
    cart.push({
      id:       String(currentProduct.id),
      name:     currentProduct.name,
      price:    currentProduct.price,
      image:    currentProduct.image,
      quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(`${quantity} × ${currentProduct.name} added to your bag!`);
}

// ── Quantity controls ─────────────────────────────────────────────────────────

document.getElementById("decreaseQuantity")?.addEventListener("click", () => {
  if (quantityInput) quantityInput.value = Math.max(1, Number(quantityInput.value || 1) - 1);
});

document.getElementById("increaseQuantity")?.addEventListener("click", () => {
  if (quantityInput) quantityInput.value = Math.min(99, Number(quantityInput.value || 1) + 1);
});

quantityInput?.addEventListener("change", () => {
  let q = Math.floor(Number(quantityInput.value));
  if (!Number.isFinite(q)) q = 1;
  quantityInput.value = Math.min(99, Math.max(1, q));
});

addButton?.addEventListener("click", addProductToCart);

// ── Mobile nav ────────────────────────────────────────────────────────────────

document.getElementById("menuToggle")?.addEventListener("click", () => {
  const nav    = document.getElementById("mainNav");
  const toggle = document.getElementById("menuToggle");
  if (!nav || !toggle) return;
  const opened = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(opened));
  toggle.textContent = opened ? "✕" : "☰";
});

// ── Footer year ───────────────────────────────────────────────────────────────

const yearEl = document.getElementById("currentYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Load product (API first, static fallback) ─────────────────────────────────

async function loadProduct() {
  const params    = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    showMissingProduct();
    return;
  }

  updateCartCount();
  if (typeof initNavAuth === "function") initNavAuth();

  // ── Try API (MongoDB IDs are 24-char hex; static IDs are short strings) ──
  // Only call the API when the id looks like a MongoDB ObjectId
  const looksLikeMongoId = /^[a-f\d]{24}$/i.test(productId);

  if (looksLikeMongoId && typeof apiFetch === "function") {
    const { ok, data } = await apiFetch(`/products/${productId}`);

    if (ok && data.product) {
      const p = data.product;
      renderProduct({
        id:          String(p._id),
        name:        p.name,
        category:    p.category,
        price:       p.price,
        image:       p.image,
        description: p.description,
        stock:       p.stock
      });
      return;
    }
  }

  // ── Static fallback ───────────────────────────────────────────────────────
  const item = STATIC_PRODUCTS.find((p) => p.id === productId);
  if (item) {
    renderProduct(item);
  } else {
    showMissingProduct();
  }
}

loadProduct();
