"use strict";

// ── Constants ─────────────────────────────────────────────────────────────────

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

// ── DOM references ────────────────────────────────────────────────────────────

const checkoutSection  = document.getElementById("checkoutSection");
const loginPrompt      = document.getElementById("loginPrompt");
const emptyCartNotice  = document.getElementById("emptyCartNotice");
const orderSuccess     = document.getElementById("orderSuccess");
const checkoutForm     = document.getElementById("checkoutForm");
const checkoutItems    = document.getElementById("checkoutItems");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutShipping = document.getElementById("checkoutShipping");
const checkoutTotal    = document.getElementById("checkoutTotal");
const checkoutError    = document.getElementById("checkoutError");
const placeOrderButton = document.getElementById("placeOrderButton");
const successMessage   = document.getElementById("successMessage");
const successDetails   = document.getElementById("successDetails");
const demoCardFields   = document.getElementById("demoCardFields");
const paymentOptions   = document.getElementById("paymentOptions");

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(amount) {
  return "$" + Number(amount).toFixed(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function showError(message) {
  if (!checkoutError) return;
  checkoutError.textContent = message;
  checkoutError.hidden = false;
  checkoutError.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
  if (checkoutError) checkoutError.hidden = true;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ── Order summary rendering ───────────────────────────────────────────────────

function renderOrderSummary() {
  const cart = getCart();

  if (!checkoutItems) return;

  checkoutItems.innerHTML = cart.map((item) => `
    <div class="checkout-item">
      <img
        src="${escapeHTML(item.image || "")}"
        alt="${escapeHTML(item.name)}"
        class="checkout-item-img"
        onerror="this.style.visibility='hidden'"
      >
      <div class="checkout-item-info">
        <span class="checkout-item-name">${escapeHTML(item.name)}</span>
        <span class="checkout-item-qty">× ${item.quantity}</span>
      </div>
      <span class="checkout-item-price">${money(item.price * item.quantity)}</span>
    </div>
  `).join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (checkoutSubtotal) checkoutSubtotal.textContent = money(subtotal);
  if (checkoutShipping) checkoutShipping.textContent = shipping === 0 ? "FREE" : money(shipping);
  if (checkoutTotal)    checkoutTotal.textContent    = money(total);
}

// ── Payment method toggle ─────────────────────────────────────────────────────

if (paymentOptions) {
  paymentOptions.addEventListener("change", (event) => {
    const radios = paymentOptions.querySelectorAll(".payment-option");
    radios.forEach((label) => {
      const radio = label.querySelector("input[type=radio]");
      label.classList.toggle("selected", radio && radio.checked);
    });

    const chosen = paymentOptions.querySelector("input[name=paymentMethod]:checked");
    if (demoCardFields) {
      demoCardFields.hidden = !chosen || chosen.value !== "demo";
    }
  });
}

// Auto-format demo card number
const cardNumberInput = document.getElementById("cardNumber");
if (cardNumberInput) {
  cardNumberInput.addEventListener("input", () => {
    let raw = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardNumberInput.value = raw.replace(/(.{4})/g, "$1 ").trim();
  });
}

const cardExpiryInput = document.getElementById("cardExpiry");
if (cardExpiryInput) {
  cardExpiryInput.addEventListener("input", () => {
    let raw = cardExpiryInput.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) raw = raw.slice(0, 2) + " / " + raw.slice(2);
    cardExpiryInput.value = raw;
  });
}

// ── Pre-fill form from saved user data ────────────────────────────────────────

function prefillForm() {
  const user = getUser();
  if (!user) return;

  const fullNameInput = document.getElementById("fullName");
  if (fullNameInput && !fullNameInput.value) {
    fullNameInput.value = user.name || "";
  }

  // Restore previously typed shipping address from sessionStorage
  try {
    const saved = JSON.parse(sessionStorage.getItem("shopease-shipping") || "null");
    if (saved && typeof saved === "object") {
      ["address", "city", "postalCode", "country", "phone"].forEach((field) => {
        const el = document.getElementById(field);
        if (el && saved[field]) el.value = saved[field];
      });
    }
  } catch {
    // ignore
  }
}

// Save shipping address to sessionStorage as the user types
function watchShippingFields() {
  ["fullName", "address", "city", "postalCode", "country", "phone"].forEach((field) => {
    const el = document.getElementById(field);
    if (!el) return;
    el.addEventListener("input", () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem("shopease-shipping") || "{}");
        saved[field] = el.value;
        sessionStorage.setItem("shopease-shipping", JSON.stringify(saved));
      } catch {
        // ignore
      }
    });
  });
}

// ── Form submission ───────────────────────────────────────────────────────────

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const cart = getCart();
    if (cart.length === 0) {
      showError("Your cart is empty. Add items before checking out.");
      return;
    }

    // Validate required fields — sanitize before use
    const fullName   = sanitizeText(document.getElementById("fullName")?.value || "");
    const address    = sanitizeText(document.getElementById("address")?.value || "");
    const city       = sanitizeText(document.getElementById("city")?.value || "");
    const postalCode = sanitizeText(document.getElementById("postalCode")?.value || "");
    const country    = sanitizeText(document.getElementById("country")?.value || "");
    const phone      = sanitizeText(document.getElementById("phone")?.value || "");

    if (!fullName || fullName.length < 2) {
      showError("Please enter your full name.");
      document.getElementById("fullName")?.focus();
      return;
    }
    if (!address || address.length < 5) {
      showError("Please enter your street address.");
      document.getElementById("address")?.focus();
      return;
    }
    if (!city || city.length < 2) {
      showError("Please enter your city.");
      document.getElementById("city")?.focus();
      return;
    }
    if (!country || country.length < 2) {
      showError("Please enter your country.");
      document.getElementById("country")?.focus();
      return;
    }

    const paymentRadio = checkoutForm.querySelector("input[name=paymentMethod]:checked");
    const paymentMethod = paymentRadio ? paymentRadio.value : "cash_on_delivery";

    // Build items array for the API — validate all IDs are MongoDB ObjectIds
    const invalidItems = cart.filter(item => !/^[a-f\d]{24}$/i.test(item.id));
    if (invalidItems.length > 0) {
      showError(
        `Some items in your cart are from the demo catalogue and can't be ordered directly. ` +
        `Please go to the Shop page, add products from there, and try again.`
      );
      if (placeOrderButton) {
        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML = "Place order <span>→</span>";
      }
      return;
    }

    const items = cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity
    }));

    const payload = {
      items,
      shippingAddress: { fullName, address, city, postalCode, country, phone },
      paymentMethod
    };

    // Disable button while request is in flight
    if (placeOrderButton) {
      placeOrderButton.disabled = true;
      placeOrderButton.textContent = "Placing order…";
    }

    const { ok, data } = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (placeOrderButton) {
      placeOrderButton.disabled = false;
      placeOrderButton.innerHTML = "Place order <span>→</span>";
    }

    if (!ok) {
      showError(data.message || "Could not place your order. Please try again.");
      return;
    }

    // ── Order placed successfully ──────────────────────────────────────────────

    clearCart();
    sessionStorage.removeItem("shopease-shipping");
    updateAllCartBadges();

    // Show success screen
    checkoutSection.hidden = true;

    if (successMessage) {
      successMessage.textContent =
        `Thank you, ${escapeHTML(fullName)}! We've received your order.`;
    }

    const order = data.order || {};
    if (successDetails && order._id) {
      successDetails.innerHTML = `
        <div class="success-row">
          <span>Order ID</span>
          <strong>#${escapeHTML(order._id.slice(-8).toUpperCase())}</strong>
        </div>
        <div class="success-row">
          <span>Total</span>
          <strong>${money(order.total || 0)}</strong>
        </div>
        <div class="success-row">
          <span>Payment</span>
          <strong>${order.paymentMethod === "cash_on_delivery" ? "Cash on delivery" : "Demo card"}</strong>
        </div>
        <div class="success-row">
          <span>Shipping to</span>
          <strong>${escapeHTML(city)}, ${escapeHTML(country)}</strong>
        </div>
      `;
    }

    orderSuccess.hidden = false;
    orderSuccess.scrollIntoView({ behavior: "smooth" });
  });
}

// ── Page initialisation ───────────────────────────────────────────────────────

function initPage() {
  // Update footer year
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    const nav    = document.getElementById("mainNav");
    const toggle = document.getElementById("menuToggle");
    if (!nav || !toggle) return;
    const opened = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(opened));
    toggle.textContent = opened ? "✕" : "☰";
  });

  // Update cart badge
  updateAllCartBadges();

  // Update nav for logged-in users
  initNavAuth();

  const cart = getCart();

  if (cart.length === 0) {
    // Nothing in cart
    checkoutSection.hidden = true;
    emptyCartNotice.hidden = false;
    return;
  }

  if (!isLoggedIn()) {
    // Redirect to login, keeping return URL
    checkoutSection.hidden = true;
    loginPrompt.hidden = false;
    return;
  }

  // All good — show the checkout form
  checkoutSection.hidden = false;
  renderOrderSummary();
  prefillForm();
  watchShippingFields();
}

initPage();
