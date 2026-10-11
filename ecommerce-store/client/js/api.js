"use strict";

// Central API configuration shared across all pages.
const API_BASE = "http://localhost:5000/api";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("token") || null;
}

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return Boolean(getToken());
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

/**
 * Thin fetch wrapper.
 * Returns { ok, data } — never throws so callers can handle errors gracefully.
 */
async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      // empty body — leave data as {}
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { message: "Cannot reach the server. Make sure the backend is running on port 5000." }
    };
  }
}

// ── Nav auth state ────────────────────────────────────────────────────────────

/**
 * Updates every page's nav based on login state.
 * Replaces the "Sign in" link with the user's name + a logout button.
 */
function initNavAuth() {
  const user = getUser();
  const loggedIn = isLoggedIn();

  // index.html uses .nav-login; other pages use a .nav-login or nav-actions link
  const loginLinks = document.querySelectorAll(".nav-login, a[href='login.html']");

  if (loggedIn && user) {
    loginLinks.forEach((link) => {
      // Only touch login/sign-in anchors — skip "Sign in" footer links that
      // should remain as they are for navigation purposes.
      if (
        link.href &&
        link.href.includes("login.html") &&
        !link.closest("footer")
      ) {
        const wrapper = document.createElement("div");
        wrapper.className = "nav-user";
        wrapper.innerHTML = `
          <span class="nav-user-name" title="Signed in as ${escapeHTML(user.email)}">
            ${escapeHTML(user.name.split(" ")[0])}
          </span>
          <button class="nav-logout button-small" type="button" aria-label="Sign out">
            Sign out
          </button>
        `;

        wrapper.querySelector(".nav-logout").addEventListener("click", () => {
          logout();
          window.location.reload();
        });

        link.replaceWith(wrapper);
      }
    });

    // Account icon on inner pages
    const accountIcon = document.querySelector('a[href="login.html"].icon-button');
    if (accountIcon) {
      accountIcon.removeAttribute("href");
      accountIcon.title = `Signed in as ${user.name}`;
    }
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// ── Input sanitization ────────────────────────────────────────────────────────

/**
 * Strip HTML tags and trim a string value.
 * Use on all user-supplied text before sending to the API or rendering.
 */
function sanitizeText(value) {
  return String(value)
    .replace(/<[^>]*>/g, "")   // strip any HTML tags
    .replace(/[<>]/g, "")      // remove stray < >
    .trim();
}

/**
 * Validate and sanitize an email address.
 * Returns the lower-cased email or null if invalid.
 */
function sanitizeEmail(value) {
  const email = String(value).trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : null;
}

// ── Cart helpers ──────────────────────────────────────────────────────────────

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((item) =>
      item &&
      item.id != null &&
      typeof item.name === "string" &&
      Number.isFinite(Number(item.price)) &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0
    ).map((item) => ({
      ...item,
      id: String(item.id),
      price: Number(item.price),
      quantity: Math.min(99, Math.floor(Number(item.quantity)))
    }));
  } catch {
    return [];
  }
}

function clearCart() {
  localStorage.removeItem("cart");
}

function updateAllCartBadges() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cartCount, #cart-count").forEach((el) => {
    el.textContent = count > 99 ? "99+" : String(count);
  });
}
