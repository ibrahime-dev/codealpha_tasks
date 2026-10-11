
const API_URL = "http://localhost:5000/api/auth";

// Display the current year in the page footer.
const yearElement = document.getElementById("authYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Show or hide passwords on both pages.
document.querySelectorAll(
  ".show-password, .auth-show-password"
).forEach((button) => {
  button.addEventListener("click", () => {
    const inputId =
      button.dataset.target || button.dataset.togglePassword;

    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
  });
});

// Display success and error messages.
function showMessage(messageElement, text, type) {
  if (!messageElement) return;

  messageElement.textContent = text;

  // Support both the register page style (.message.visible.error/success)
  // and the login page style (.auth-message.error/success / .is-error / .is-success)
  if (messageElement.classList.contains("message")) {
    messageElement.className = `message visible ${type}`;
  } else {
    messageElement.className = `auth-message is-visible is-${type}`;
    messageElement.style.display = "block";
  }
}

// Send login or registration data to the Express backend.
async function sendAuthRequest(endpoint, formData, messageElement, button) {
  const originalButtonText = button
    ? button.textContent
    : "";

  if (button) {
    button.disabled = true;
    button.textContent =
      endpoint === "register"
        ? "Creating account..."
        : "Signing in...";
  }

  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `Request failed (${response.status}).`
      );
    }

    if (!data.token) {
      throw new Error(
        data.message ||
        "The server did not return an authentication token."
      );
    }

    // Save the token for authenticated requests.
    localStorage.setItem("token", data.token);

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    showMessage(
      messageElement,
      data.message ||
        (endpoint === "register"
          ? "Account created successfully!"
          : "Login successful!"),
      "success"
    );

    // Admins go to the dashboard; customers go to the redirect target or homepage.
    const redirectParam = new URLSearchParams(window.location.search).get("redirect");
    let destination = "index.html";

    if (data.user?.role === "admin") {
      destination = "admin.html";
    } else if (redirectParam && /^[\w\-.]+\.html(\?.*)?$/.test(redirectParam)) {
      destination = redirectParam;
    }

    window.setTimeout(() => {
      window.location.href = destination;
    }, 800);

  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof TypeError) {
      showMessage(
        messageElement,
        "Cannot connect to the server. Please make sure your backend is running on port 5000.",
        "error"
      );
    } else {
      showMessage(
        messageElement,
        error.message || "Something went wrong. Please try again.",
        "error"
      );
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  }
}

// REGISTRATION PAGE
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const messageElement = document.getElementById("authMessage");
  const registerButton = document.getElementById("registerButton");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registerForm.reportValidity()) return;

    const name     = sanitizeText(document.getElementById("name").value);
    const email    = sanitizeEmail(document.getElementById("email").value) ||
                     document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms");

    if (name.length < 2) {
      showMessage(
        messageElement,
        "Please enter your full name.",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      showMessage(
        messageElement,
        "Your password must contain at least 8 characters.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage(
        messageElement,
        "Your passwords do not match.",
        "error"
      );
      return;
    }

    if (terms && !terms.checked) {
      showMessage(
        messageElement,
        "Please agree to the terms before continuing.",
        "error"
      );
      return;
    }

    await sendAuthRequest(
      "register",
      { name, email, password },
      messageElement,
      registerButton
    );
  });
}

// LOGIN PAGE
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const messageElement = document.getElementById("authMessage");
  const loginButton = document.getElementById("loginButton");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!loginForm.reportValidity()) return;

    const email    = sanitizeEmail(document.getElementById("email").value) ||
                     document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    await sendAuthRequest(
      "login",
      { email, password },
      messageElement,
      loginButton
    );
  });
}

console.log("ShopEase auth.js loaded successfully!");
