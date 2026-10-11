"use strict";

const loginPrompt   = document.getElementById("loginPrompt");
const ordersSection = document.getElementById("ordersSection");
const ordersList    = document.getElementById("ordersList");
const ordersEmpty   = document.getElementById("ordersEmpty");
const orderCountLabel = document.getElementById("orderCountLabel");

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(amount) {
  return "$" + Number(amount).toFixed(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year:  "numeric",
      month: "long",
      day:   "numeric"
    });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status) {
  const map = {
    pending:    "status-pending",
    confirmed:  "status-confirmed",
    processing: "status-processing",
    shipped:    "status-shipped",
    delivered:  "status-delivered",
    cancelled:  "status-cancelled"
  };
  return map[status] || "status-pending";
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersEmpty.hidden = false;
    return;
  }

  ordersEmpty.hidden = true;
  orderCountLabel.textContent = `(${orders.length} order${orders.length === 1 ? "" : "s"})`;

  ordersList.innerHTML = orders.map((order) => {
    const shortId = order._id.slice(-8).toUpperCase();
    const itemsHTML = order.items.map((item) => `
      <div class="order-item">
        <img src="${escapeHTML(item.image || "")}"
             alt="${escapeHTML(item.name)}"
             onerror="this.style.visibility='hidden'">
        <div class="order-item-info">
          <span class="order-item-name">${escapeHTML(item.name)}</span>
          <span class="order-item-meta">× ${item.quantity} &nbsp;·&nbsp; ${money(item.price)} each</span>
        </div>
        <span class="order-item-total">${money(item.price * item.quantity)}</span>
      </div>
    `).join("");

    return `
      <article class="order-card">
        <div class="order-card-header">
          <div class="order-card-meta">
            <span class="order-id">Order #${escapeHTML(shortId)}</span>
            <span class="order-date">${formatDate(order.createdAt)}</span>
          </div>
          <span class="order-status-badge ${statusBadgeClass(order.orderStatus)}">
            ${statusLabel(order.orderStatus)}
          </span>
        </div>

        <div class="order-items">${itemsHTML}</div>

        <div class="order-card-footer">
          <div class="order-footer-row">
            <span>Payment</span>
            <strong>${order.paymentMethod === "cash_on_delivery" ? "Cash on delivery" : "Demo card"}</strong>
          </div>
          <div class="order-footer-row">
            <span>Shipping to</span>
            <strong>${escapeHTML(order.shippingAddress.city)}, ${escapeHTML(order.shippingAddress.country)}</strong>
          </div>
          <div class="order-footer-row order-footer-total">
            <span>Total</span>
            <strong>${money(order.total)}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    const nav    = document.getElementById("mainNav");
    const toggle = document.getElementById("menuToggle");
    if (!nav || !toggle) return;
    const opened = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(opened));
    toggle.textContent = opened ? "✕" : "☰";
  });

  updateAllCartBadges();
  initNavAuth();

  if (!isLoggedIn()) {
    loginPrompt.hidden = false;
    return;
  }

  ordersSection.hidden = false;
  ordersList.innerHTML = `<p class="loading-text">Loading your orders…</p>`;

  const { ok, data } = await apiFetch("/orders/my-orders");

  if (!ok) {
    ordersList.innerHTML = `
      <div class="orders-error">
        <p>${escapeHTML(data.message || "Could not load orders. Please try again.")}</p>
        <button class="button button-outline" onclick="location.reload()">Retry</button>
      </div>`;
    return;
  }

  ordersList.innerHTML = "";
  renderOrders(data.orders || []);
}

init();
