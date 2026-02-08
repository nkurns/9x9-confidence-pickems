import { API_URL } from "./config.js";
import { loadNavbar } from "./dashboard.js";

class LoginManager {
  constructor() {
    this.initializeElements();
    this.addEventListeners();
    this.setupModalClose();
    this.checkLoginState(); // Check login state on initialization
  }

  initializeElements() {
    // Auth buttons
    this.loginBtn = document.getElementById("loginBtn");
    this.registerBtn = document.getElementById("registerBtn");
    this.authModal = document.getElementById("authModal");

    // Login form elements
    this.loginForm = document.getElementById("formLogin");
    this.loginUsername = document.getElementById("username");
    this.loginPassword = document.getElementById("password");
    this.loginError = document.getElementById("loginError");

    // Content elements
    this.loggedInContent = document.getElementById("loggedInContent");
    this.loggedOutContent = document.getElementById("loggedOutContent");
    this.userDisplayName = document.getElementById("userDisplayName");

    // Register form elements
    this.registerForm = document.getElementById("registerFormElement");
    this.registerUsername = document.getElementById("registerUsername");
    this.registerEmail = document.getElementById("registerEmail");
    this.registerPassword = document.getElementById("registerPassword");
    this.registerError = document.getElementById("registerError");
  }

  addEventListeners() {
    if (this.loginBtn && this.loginForm) {
      // Auth button clicks
      this.loginBtn.addEventListener("click", () => this.showModal("login"));
      this.registerBtn?.addEventListener("click", () =>
        this.showModal("register")
      );

      // Form submissions
      this.loginForm.addEventListener("submit", async (e) =>
        this.handleLogin(e)
      );
      this.registerForm?.addEventListener("submit", (e) =>
        this.handleRegister(e)
      );
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = this.loginUsername.value;
    const password = this.loginPassword.value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response data:", data);

      if (!response.ok) {
        console.error("Login response:", data);
        throw new Error(data.message || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update UI
      this.updateUIForLoggedInUser(data.user);

      // Close the modal
      this.closeModal();

      // Load the navbar
      loadNavbar();

      // After successful login, update the active nav link
      this.updateActiveNavLink();
    } catch (error) {
      console.error("Login error:", error.message);
      //     alert("Login failed: " + error.message);
    }
  }

  closeModal() {
    if (this.authModal) {
      this.authModal.style.display = "none";
    }
  }

  updateUIForLoggedInUser(user) {
    if (this.loggedOutContent) this.loggedOutContent.style.display = "none";
    if (this.loggedInContent) this.loggedInContent.style.display = "block";
    if (this.userDisplayName)
      this.userDisplayName.textContent = user.displayName;
  }

  checkLoginState() {
    const token = localStorage.getItem("token");
    console.log("Checking login state:", {
      token: token,
      user: localStorage.getItem("user"),
    });

    if (token) {
      const user = JSON.parse(localStorage.getItem("user"));
      this.updateUIForLoggedInUser(user);
    }
  }

  updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll("nav ul li a");

    navLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // ... rest of your existing methods (showModal, closeModal, etc.) ...
}

// Initialize login manager when document is ready
document.addEventListener("DOMContentLoaded", () => {
  new LoginManager();
});
