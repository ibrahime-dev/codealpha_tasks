"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const productGrid  = document.getElementById("product-grid");
  if (!productGrid) return;

  const searchInput  = document.getElementById("product-search");
  const searchForm   = document.getElementById("product-search-form");
  const filterButtons = document.querySelectorAll(".filter-chip");
  const emptyResults = document.getElementById("empty-results");
  const cartCount    = document.getElementById("cart-count");
  const toast        = document.getElementById("toast");
  const menuToggle   = document.getElementById("menu-toggle");
  const mainNav      = document.getElementById("main-nav");
  const searchToggle = document.getElementById("search-toggle");

  let activeCategory = "All";
  let toastTimeout;
  let allProducts = [];   // full list from API

  // ── Static fallback catalogue ─────────────────────────────────────────────
  const STATIC = [
    { id:"p101", name:"Studio Wireless Headphones", category:"Electronics", price:79.00,  image:"images/headphones.jpg",  badge:"BESTSELLER" },
    { id:"p102", name:"Everyday Classic Sneakers",  category:"Fashion",     price:64.00,  image:"images/sneakers.jpg",    badge:"JUST ARRIVED" },
    { id:"p103", name:"Minimal Ceramic Table Lamp", category:"Home",        price:48.00,  image:"images/lamp.jpg",        badge:"" },
    { id:"p104", name:"Timeless Everyday Backpack", category:"Fashion",     price:55.00,  image:"images/handbags.jpg",    badge:"" },
    { id:"5",    name:"Wireless Earbuds",           category:"Electronics", price:29.99,  image:"images/earbuds.jpg",     badge:"New" },
    { id:"6",    name:"Digital Camera",             category:"Electronics", price:199.99, image:"images/camera.jpg",      badge:"" },
    { id:"7",    name:"Bluetooth Speaker",          category:"Electronics", price:39.99,  image:"images/speaker.jpg",     badge:"" },
    { id:"8",    name:"Premium Headphones",         category:"Electronics", price:59.99,  image:"images/head-phones.jpg", badge:"" },
    { id:"9",    name:"Smartwatch",                 category:"Electronics", price:79.99,  image:"images/smartwatch.jpg",  badge:"Popular" },
    { id:"10",   name:"Smartwatch Series",          category:"Electronics", price:89.99,  image:"images/smartwatchs.jpg", badge:"" },
    { id:"11",   name:"Running Sneakers",           category:"Fashion",     price:59.99,  image:"images/sneakers-a.jpg",  badge:"" },
    { id:"12",   name:"Running Shoes",              category:"Fashion",     price:74.99,  image:"images/running-shoes.jpg",badge:"" },
    { id:"13",   name:"Casual T-shirt",             category:"Fashion",     price:19.99,  image:"images/tshirt.jpg",      badge:"" },
    { id:"14",   name:"Leather Handbag",            category:"Accessories", price:44.99,  image:"images/handbag.jpg",     badge:"Popular" },
    { id:"15",   name:"Fashion Handbag",            category:"Accessories", price:49.99,  image:"images/handbags.jpg",    badge:"" },
    { id:"16",   name:"Coffee Mug",                 category:"Home",        price:12.99,  image:"images/mug.jpg",         badge:"" },
    { id:"17",   name:"Minimal Classic Watch",      category:"Accessories", price:49.99,  image:"images/watch.jpg",       badge:"" },
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────

  function escapeHTML(v) {
    return String(v).replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
  }

  function money(n) { return "$" + Number(n).toFixed(2); }

  function readStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
    catch { return fallback; }
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function updateCartCount() {
    if (!cartCount) return;
    const cart = readStorage("cart", []);
    const count = Array.isArray(cart)
      ? cart.reduce((s, i) => s + Math.max(0, Number(i.quantity) || 0), 0) : 0;
    cartCount.textContent = count > 99 ? "99+" : String(count);
    cartCount.setAttribute("aria-label", `${count} items in cart`);
  }

  // ── Render cards ──────────────────────────────────────────────────────────

  function renderCards(products) {
    const favorites = new Set(readStorage("shopease-favorites", []));
    const term = (searchInput?.value || "").trim().toLowerCase();

    const filtered = products.filter(p => {
      const matchCat    = activeCategory === "All" ||
                          p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(term) ||
                          p.category.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      productGrid.innerHTML = "";
      if (emptyResults) emptyResults.hidden = false;
      return;
    }
    if (emptyResults) emptyResults.hidden = true;

    productGrid.innerHTML = filtered.map(p => {
      const isFav = favorites.has(String(p.id));
      const badge = p.badge || (p.featured ? "FEATURED" : "");
      return `
      <article class="product-card"
        data-id="${escapeHTML(String(p.id))}"
        data-name="${escapeHTML(p.name)}"
        data-category="${escapeHTML(p.category)}"
        data-price="${p.price}">

        <div class="product-image">
          ${badge ? `<span class="product-badge${badge === "JUST ARRIVED" || badge === "New" ? " badge-new" : ""}">${escapeHTML(badge)}</span>` : ""}

          <button class="wishlist-button" type="button"
            aria-label="Add ${escapeHTML(p.name)} to favorites"
            aria-pressed="${isFav}">${isFav ? "♥" : "♡"}</button>

          <a href="product-details.html?id=${encodeURIComponent(p.id)}"
            class="product-image-link"
            aria-label="View ${escapeHTML(p.name)}">
            <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy"
              onerror="this.onerror=null;this.style.visibility='hidden'">
          </a>

          <button class="quick-add" type="button"
            aria-label="Add ${escapeHTML(p.name)} to cart">Add to Cart</button>
        </div>

        <div class="product-info">
          <span class="product-category">
            ${p.category === "Home" ? "HOME &amp; LIVING" : escapeHTML(p.category.toUpperCase())}
          </span>
          <h3><a href="product-details.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.name)}</a></h3>
          <div class="product-bottom">
            <span class="product-price">${money(p.price)}</span>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  // ── Load products from API, fall back to static ───────────────────────────

  productGrid.innerHTML = `<p class="loading-text">Loading products…</p>`;

  if (typeof apiFetch === "function") {
    const { ok, data } = await apiFetch("/products");
    if (ok && Array.isArray(data.products) && data.products.length > 0) {
      allProducts = data.products.map(p => ({
        id:       p._id,
        name:     p.name,
        category: p.category,
        price:    p.price,
        image:    p.image,
        badge:    p.featured ? "FEATURED" : "",
        featured: p.featured
      }));
    }
  }

  if (allProducts.length === 0) allProducts = STATIC;

  renderCards(allProducts);

  // ── Search & filter ───────────────────────────────────────────────────────

  if (searchInput) searchInput.addEventListener("input", () => renderCards(allProducts));

  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      renderCards(allProducts);
      document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.filter || "All";
      filterButtons.forEach(b => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderCards(allProducts);
    });
  });

  // ── Cart & wishlist clicks ────────────────────────────────────────────────

  productGrid.addEventListener("click", event => {

    // Wishlist
    const wishBtn = event.target.closest(".wishlist-button");
    if (wishBtn) {
      const card = wishBtn.closest(".product-card");
      const id   = card?.dataset.id;
      if (!id) return;
      const favorites = new Set(readStorage("shopease-favorites", []));
      if (favorites.has(id)) {
        favorites.delete(id);
        wishBtn.textContent = "♡";
        wishBtn.setAttribute("aria-pressed", "false");
        showToast("Removed from favorites.");
      } else {
        favorites.add(id);
        wishBtn.textContent = "♥";
        wishBtn.setAttribute("aria-pressed", "true");
        showToast("Added to favorites.");
      }
      try { localStorage.setItem("shopease-favorites", JSON.stringify([...favorites])); }
      catch { /* ignore */ }
      return;
    }

    // Add to Cart
    const addBtn = event.target.closest(".quick-add");
    if (!addBtn) return;
    const card = addBtn.closest(".product-card");
    if (!card) return;

    const product = {
      id:       card.dataset.id,
      name:     card.dataset.name,
      price:    Number(card.dataset.price),
      image:    card.querySelector(".product-image img")?.src || "",
      quantity: 1
    };

    const cart     = readStorage("cart", []);
    const safeCart = Array.isArray(cart) ? cart : [];
    const existing = safeCart.find(i => String(i.id) === product.id);

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 0) + 1;
    } else {
      safeCart.push(product);
    }

    try {
      localStorage.setItem("cart", JSON.stringify(safeCart));
      updateCartCount();
      showToast(`${product.name} added to your cart!`);
    } catch {
      showToast("Could not save your cart.");
    }
  });

  // ── Nav ───────────────────────────────────────────────────────────────────

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      mainNav.classList.toggle("open", !open);
    });
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (searchToggle && searchInput) {
    searchToggle.addEventListener("click", () => {
      document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
      searchInput.focus();
    });
  }

  // ── Newsletter ────────────────────────────────────────────────────────────

  const newsletterForm    = document.getElementById("newsletter-form");
  const newsletterEmail   = document.getElementById("newsletter-email");
  const newsletterMessage = document.getElementById("newsletter-message");

  if (newsletterForm && newsletterEmail && newsletterMessage) {
    newsletterForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!newsletterEmail.checkValidity()) { newsletterEmail.reportValidity(); return; }
      newsletterMessage.textContent = "Thanks for your interest! Newsletter signup coming soon.";
      newsletterForm.reset();
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  updateCartCount();
  if (typeof initNavAuth === "function") initNavAuth();
});
