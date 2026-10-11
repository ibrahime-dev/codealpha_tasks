"use strict";

// ── Auth guard — redirect non-admins ─────────────────────────────────────────
const user = getUser();
if (!user || user.role !== "admin") {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ── Show admin name ───────────────────────────────────────────────────────────
const adminNameEl   = document.getElementById("adminName");
const adminAvatarEl = document.getElementById("adminAvatar");
if (user) {
  if (adminNameEl)   adminNameEl.textContent   = user.name;
  if (adminAvatarEl) adminAvatarEl.textContent = user.name.charAt(0).toUpperCase();
}

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById("adminLogout")?.addEventListener("click", () => {
  logout();
  window.location.href = "login.html";
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function money(n) { return "$" + Number(n).toFixed(2); }

function escapeHTML(v) {
  return String(v).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}); }
  catch { return iso; }
}

function statusBadge(s) {
  const map = {
    pending:"badge-pending", confirmed:"badge-confirmed",
    processing:"badge-confirmed", shipped:"badge-shipped",
    delivered:"badge-delivered", cancelled:"badge-cancelled"
  };
  return `<span class="badge ${map[s]||"badge-pending"}">${escapeHTML(s)}</span>`;
}

// ── Navigation ────────────────────────────────────────────────────────────────
const sections  = document.querySelectorAll(".admin-section");
const navLinks  = document.querySelectorAll(".admin-nav a[data-section]");
const pageTitle = document.getElementById("pageTitle");

function showSection(name) {
  sections.forEach(s => s.classList.toggle("active", s.id === `section-${name}`));
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.section === name));
  if (pageTitle) pageTitle.textContent =
    name.charAt(0).toUpperCase() + name.slice(1);
  loadSection(name);
}

navLinks.forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    showSection(a.dataset.section);
  });
});

// Also handle "View all →" links inside cards
document.addEventListener("click", e => {
  const link = e.target.closest("a[data-section]");
  if (link) { e.preventDefault(); showSection(link.dataset.section); }
});

// ── Section loaders ───────────────────────────────────────────────────────────
const loaded = {};

async function loadSection(name) {
  if (loaded[name]) return;
  loaded[name] = true;

  if (name === "dashboard") await loadDashboard();
  if (name === "products")  await loadProducts();
  if (name === "orders")    await loadOrders();
  if (name === "users")     await loadUsers();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  const { ok, data } = await apiFetch("/admin/stats");
  if (ok) {
    document.getElementById("statProducts").textContent = data.productCount ?? "—";
    document.getElementById("statOrders").textContent   = data.orderCount   ?? "—";
    document.getElementById("statUsers").textContent    = data.userCount    ?? "—";
    document.getElementById("statRevenue").textContent  = money(data.revenue ?? 0);
  }

  // Recent orders (last 5)
  const { ok: ok2, data: d2 } = await apiFetch("/admin/orders");
  const el = document.getElementById("recentOrdersTable");
  if (!ok2 || !d2.orders?.length) {
    el.innerHTML = `<div class="empty-state-sm">No orders yet.</div>`; return;
  }

  const recent = d2.orders.slice(0, 5);
  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>
        ${recent.map(o => `
          <tr>
            <td>#${escapeHTML(o._id.slice(-8).toUpperCase())}</td>
            <td>${escapeHTML(o.user?.name || "—")}</td>
            <td>${money(o.total)}</td>
            <td>${statusBadge(o.orderStatus)}</td>
            <td>${formatDate(o.createdAt)}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  const el = document.getElementById("productsTable");
  const { ok, data } = await apiFetch("/products");
  if (!ok) { el.innerHTML = `<div class="error-state">Failed to load products.</div>`; return; }
  if (!data.products?.length) { el.innerHTML = `<div class="empty-state-sm">No products found.</div>`; return; }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th>
      </tr></thead>
      <tbody id="productsTbody">
        ${data.products.map(p => `
          <tr id="prod-${escapeHTML(p._id)}">
            <td>${escapeHTML(p.name)}</td>
            <td>${escapeHTML(p.category)}</td>
            <td>${money(p.price)}</td>
            <td>${p.stock}</td>
            <td><span class="badge ${p.isActive ? "badge-active":"badge-inactive"}">${p.isActive?"Active":"Inactive"}</span></td>
            <td>
              <button class="btn-danger" data-delete="${escapeHTML(p._id)}">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  el.addEventListener("click", async e => {
    const btn = e.target.closest("[data-delete]");
    if (!btn) return;
    if (!confirm("Deactivate this product?")) return;
    const id = btn.dataset.delete;
    const { ok: dok } = await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
    if (dok) {
      const row = document.getElementById(`prod-${id}`);
      if (row) row.querySelector("td:nth-child(5)").innerHTML =
        `<span class="badge badge-inactive">Inactive</span>`;
      btn.remove();
    }
  });
}

// Add product form
document.getElementById("addProductForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("addProductBtn");
  const msg = document.getElementById("productFormMsg");
  btn.disabled = true; btn.textContent = "Adding…";

  const payload = {
    name:        document.getElementById("pName").value.trim(),
    description: document.getElementById("pDesc").value.trim(),
    category:    document.getElementById("pCategory").value,
    price:       parseFloat(document.getElementById("pPrice").value),
    stock:       parseInt(document.getElementById("pStock").value, 10),
    image:       document.getElementById("pImage").value.trim(),
    featured:    document.getElementById("pFeatured").checked
  };

  const { ok, data } = await apiFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  btn.disabled = false; btn.textContent = "Add Product";
  msg.className = `form-message ${ok ? "success" : "error"}`;
  msg.textContent = data.message || (ok ? "Product added!" : "Failed.");

  if (ok) {
    e.target.reset();
    loaded.products = false;   // force reload
    await loadProducts();
  }
});

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders() {
  const el = document.getElementById("ordersTable");
  const { ok, data } = await apiFetch("/admin/orders");
  if (!ok) { el.innerHTML = `<div class="error-state">Failed to load orders.</div>`; return; }
  if (!data.orders?.length) { el.innerHTML = `<div class="empty-state-sm">No orders yet.</div>`; return; }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Order ID</th><th>Customer</th><th>Items</th>
        <th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Update</th>
      </tr></thead>
      <tbody>
        ${data.orders.map(o => `
          <tr>
            <td>#${escapeHTML(o._id.slice(-8).toUpperCase())}</td>
            <td>${escapeHTML(o.user?.name || "—")}<br>
                <small style="color:#8a93a8">${escapeHTML(o.user?.email || "")}</small></td>
            <td>${o.items.length} item${o.items.length===1?"":"s"}</td>
            <td>${money(o.total)}</td>
            <td>${o.paymentMethod === "cash_on_delivery" ? "Cash" : "Card"}</td>
            <td id="status-${escapeHTML(o._id)}">${statusBadge(o.orderStatus)}</td>
            <td>${formatDate(o.createdAt)}</td>
            <td>
              <select class="order-status-select" data-order="${escapeHTML(o._id)}"
                style="padding:5px 8px;border:1px solid #d7dfeb;border-radius:6px;font-size:12px">
                ${["pending","confirmed","processing","shipped","delivered","cancelled"]
                  .map(s => `<option value="${s}" ${o.orderStatus===s?"selected":""}>${s}</option>`)
                  .join("")}
              </select>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  el.addEventListener("change", async e => {
    const sel = e.target.closest(".order-status-select");
    if (!sel) return;
    const id     = sel.dataset.order;
    const status = sel.value;
    const { ok: uok, data: ud } = await apiFetch(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    const cell = document.getElementById(`status-${id}`);
    if (uok && cell) cell.innerHTML = statusBadge(status);
    else sel.value = sel.querySelector("[selected]")?.value || "pending";
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
  const el = document.getElementById("usersTable");
  const { ok, data } = await apiFetch("/admin/users");
  if (!ok) { el.innerHTML = `<div class="error-state">Failed to load users.</div>`; return; }
  if (!data.users?.length) { el.innerHTML = `<div class="empty-state-sm">No users found.</div>`; return; }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
      </tr></thead>
      <tbody>
        ${data.users.map(u => `
          <tr>
            <td>${escapeHTML(u.name)}</td>
            <td>${escapeHTML(u.email)}</td>
            <td><span class="badge ${u.role==="admin"?"badge-shipped":"badge-active"}">${escapeHTML(u.role)}</span></td>
            <td>${formatDate(u.createdAt)}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

// ── Boot: load dashboard ──────────────────────────────────────────────────────
loadSection("dashboard");
