
"use strict";

const SHIPPING_FEE = 10;
const FREE_SHIPPING_THRESHOLD = 100;

const cartItemsContainer = document.getElementById("cartItems");
const cartLayout = document.getElementById("cartLayout");
const cartEmpty = document.getElementById("cartEmpty");
const subtotalElement = document.getElementById("cartSubtotal");
const shippingElement = document.getElementById("shippingCost");
const totalElement = document.getElementById("cartTotal");
const shippingNote = document.getElementById("shippingNote");
const itemCountElement = document.getElementById("cartItemCount");
const checkoutButton = document.getElementById("checkoutButton");

function formatMoney(amount) {
  return "$" + amount.toFixed(2);
}

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      return item &&
        item.id != null &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) > 0;
    }).map((item) => ({
      ...item,
      id: String(item.id),
      price: Number(item.price),
      quantity: Math.min(99, Math.floor(Number(item.quantity)))
    }));
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartBadges(cart) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  document.querySelectorAll("#cartCount").forEach((element) => {
    element.textContent = count;
  });

  if (itemCountElement) {
    itemCountElement.textContent =
      `(${count} item${count === 1 ? "" : "s"})`;
  }
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function renderCart() {
  const cart = getCart();
  updateCartBadges(cart);

  if (cart.length === 0) {
    cartLayout.hidden = true;
    cartEmpty.hidden = false;
    subtotalElement.textContent = formatMoney(0);
    shippingElement.textContent = formatMoney(0);
    totalElement.textContent = formatMoney(0);
    return;
  }

  cartLayout.hidden = false;
  cartEmpty.hidden = true;

  cartItemsContainer.innerHTML = cart.map((item) => {
    const lineTotal = item.price * item.quantity;
    const image = typeof item.image === "string" ? item.image : "";

    return `
      <article class="cart-item-row">
        <div class="cart-product">
          <img src="${escapeAttribute(image)}"
               alt="${escapeAttribute(item.name)}"
               onerror="this.style.visibility='hidden'">
          <div class="cart-product-info">
            <h3>${escapeHTML(item.name)}</h3>
            <p>Item #${escapeHTML(item.id)}</p>
            <button class="remove-item" type="button"
              data-action="remove" data-id="${escapeAttribute(item.id)}">
              Remove
            </button>
          </div>
        </div>

        <div class="cart-unit-price">${formatMoney(item.price)}</div>

        <div class="cart-quantity" aria-label="Quantity for ${escapeAttribute(item.name)}">
          <button type="button" data-action="decrease" data-id="${escapeAttribute(item.id)}"
            aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${escapeAttribute(item.id)}"
            aria-label="Increase quantity">+</button>
        </div>

        <div class="cart-line-total">${formatMoney(lineTotal)}</div>
      </article>
    `;
  }).join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  subtotalElement.textContent = formatMoney(subtotal);
  shippingElement.textContent = shipping === 0 ? "FREE" : formatMoney(shipping);
  totalElement.textContent = formatMoney(total);

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingNote.textContent = "You've unlocked free shipping!";
  } else {
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
    shippingNote.textContent =
      `Add ${formatMoney(remaining)} more for free shipping.`;
  }

  checkoutButton.setAttribute("href", "checkout.html");
  checkoutButton.setAttribute("aria-disabled", "false");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

cartItemsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);

  if (!item) return;

  if (action === "remove") {
    saveCart(cart.filter((entry) => entry.id !== id));
    showToast(`${item.name} removed from your bag.`);
  } else if (action === "increase") {
    if (item.quantity < 99) {
      item.quantity += 1;
      saveCart(cart);
    } else {
      showToast("Maximum quantity is 99.");
    }
  } else if (action === "decrease") {
    if (item.quantity > 1) {
      item.quantity -= 1;
      saveCart(cart);
    } else {
      saveCart(cart.filter((entry) => entry.id !== id));
      showToast(`${item.name} removed from your bag.`);
    }
  }

  renderCart();
});

document.getElementById("menuToggle")?.addEventListener("click", () => {
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("menuToggle");
  if (!nav || !toggle) return;

  const opened = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(opened));
  toggle.setAttribute("aria-label", opened ? "Close navigation" : "Open navigation");
  toggle.textContent = opened ? "✕" : "☰";
});

document.getElementById("currentYear").textContent = new Date().getFullYear();

// Update nav for logged-in users (api.js must be loaded first)
if (typeof initNavAuth === "function") initNavAuth();

renderCart();
