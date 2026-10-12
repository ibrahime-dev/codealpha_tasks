"use strict";

(() => {
  const API_BASE_URL = window.TaskFlowConfig.apiBaseUrl;
  const REQUEST_TIMEOUT_MS = 15000;
  const TOKEN_KEY = "taskflow.token";
  const USER_KEY = "taskflow.user";

  const readUser = () => {
    try {
      const rawUser = sessionStorage.getItem(USER_KEY);
      return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
      console.error("Could not read the saved TaskFlow profile.", error);
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const saveSession = ({ token, user }) => {
    if (typeof token !== "string" || !token || !user || typeof user !== "object") {
      throw new Error("The server returned an incomplete sign-in response.");
    }

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const responseMessage = (payload, status) => {
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return payload.errors.map((item) => item.message).filter(Boolean).join(" ");
    }

    if (Array.isArray(payload?.details) && payload.details.length > 0) {
      return payload.details.join(" ");
    }

    if (typeof payload?.message === "string" && payload.message) {
      return payload.message;
    }

    return "The request could not be completed (HTTP " + status + ").";
  };

  const request = async (path, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const token = sessionStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", "Bearer " + token);
    }

    if (window.location.protocol === "file:") {
      throw new Error("TaskFlow must be opened from its HTTP address, not as a file. Start the app and open its HTTP page.");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const requestUrl = new URL(`${API_BASE_URL}${path}`, window.location.href);
    let response;

    try {
      response = await fetch(requestUrl, {
        ...options,
        method,
        headers,
        signal: controller.signal
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`TaskFlow API request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
      }

      if (error instanceof TypeError) {
        throw new Error(
          `Can't reach TaskFlow API at ${new URL(API_BASE_URL, window.location.href).href}. ` +
          "Check that the backend is running and that this page's origin is configured in CLIENT_ORIGIN."
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      if (response.status === 401 && token && !path.startsWith("/auth/")) {
        clearSession();
        window.location.assign("login.html?expired=1");
      }

      if (response.status === 405) {
        const allowedMethods = response.headers.get("allow");
        throw new Error(
          `${method} ${requestUrl.href} is not allowed (HTTP 405).` +
          (allowedMethods ? ` Allowed methods: ${allowedMethods}.` : "")
        );
      }

      throw new Error(responseMessage(payload, response.status));
    }

    return payload;
  };

  const showToast = (message, isError = false) => {
    const region = document.getElementById("toast-region");
    if (!region) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = isError ? "toast is-error" : "toast";
    toast.setAttribute("role", isError ? "alert" : "status");
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 4200);
  };

  const showPageError = (message) => {
    const errorElement = document.getElementById("page-error");
    if (!errorElement) {
      showToast(message, true);
      return;
    }

    errorElement.textContent = message;
    errorElement.hidden = false;
  };

  const requireSession = () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      const returnTo = window.location.pathname.split("/").pop() + window.location.search;
      window.location.replace("login.html?returnTo=" + encodeURIComponent(returnTo));
      return false;
    }

    return true;
  };

  const redirectSignedInUser = () => {
    if (sessionStorage.getItem(TOKEN_KEY)) {
      window.location.replace("index.html");
      return true;
    }

    return false;
  };

  const getInitials = (name) =>
    (name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "?";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[character];
    });

  const formatDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, options).format(date);
  };

  window.TaskFlow = {
    API_BASE_URL,
    clearSession,
    escapeHtml,
    formatDate,
    getInitials,
    readUser,
    redirectSignedInUser,
    request,
    requireSession,
    saveSession,
    showPageError,
    showToast
  };
})();