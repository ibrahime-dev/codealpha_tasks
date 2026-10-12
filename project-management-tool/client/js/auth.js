"use strict";

(() => {
  const api = window.TaskFlow;

  if (!api || api.redirectSignedInUser()) {
    return;
  }

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const form = loginForm || registerForm;
  const errorElement = document.getElementById("auth-error");
  const submitButton = form?.querySelector('button[type="submit"]');
  const noticeElement = document.getElementById("auth-notice");

  if (!form || !errorElement || !submitButton) {
    return;
  }

  if (new URLSearchParams(window.location.search).get("expired") === "1" && noticeElement) {
    noticeElement.textContent = "Your session expired. Please sign in again.";
    noticeElement.hidden = false;
  }

  const setBusy = (busy) => {
    submitButton.disabled = busy;
    submitButton.textContent = busy
      ? "Please wait…"
      : loginForm
        ? "Sign in"
        : "Create account";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorElement.textContent = "";
    setBusy(true);

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const isRegister = Boolean(registerForm);
    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    const body = isRegister
      ? {
          name: String(values.name).trim(),
          email: String(values.email).trim(),
          password: String(values.password)
        }
      : {
          email: String(values.email).trim(),
          password: String(values.password)
        };

    try {
      const result = await api.request(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      api.saveSession(result);

      if (isRegister) {
        api.showToast("Account created successfully! Welcome to TaskFlow 🎉");
        setTimeout(() => window.location.assign("index.html"), 1800);
      } else {
        window.location.assign("index.html");
      }
    } catch (error) {
      errorElement.textContent = error.message || "We couldn't sign you in. Please try again.";
      setBusy(false);
    }
  });
})();
