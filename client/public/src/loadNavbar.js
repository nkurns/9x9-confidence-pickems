import { API_URL } from "./config.js";
import auth from "./auth.js";

window.showLogoutModal = function () {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Confirm Logout</h2>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to log out?</p>
      </div>
      <div class="modal-footer">
        <button class="modal-button modal-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="modal-button modal-confirm" onclick="handleLogout()">Logout</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Add this new function to handle logout
window.handleLogout = function () {
  console.log("Handling logout...");
  auth.logoutUser();
};

// Add this near the top with the other window functions
window.showLoginModal = function () {
  console.log("Showing login modal from global handler");
  auth.showLoginModal();
};

// Add these global handlers
window.handleLoginSubmit = function (event) {
  auth.handleLoginSubmit(event);
};

window.closeLoginModal = function () {
  auth.closeLoginModal();
};

export async function loadNavbar() {
  console.log("Loading navbar...");
  try {
    const response = await fetch("/navbar.html");
    const html = await response.text();

    const navbarContainer = document.getElementById("navbarContainer");
    if (navbarContainer) {
      navbarContainer.innerHTML = html;

      // Initialize navbar after insertion
      await initializeNavbar();

      // Update active nav link
      updateActiveNavLink();
    }
  } catch (error) {
    console.error("Error loading navbar:", error);
  }
}

async function initializeNavbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("Initializing navbar...", { user });

  if (user && user.username) {
    await renderAuthenticatedNav(user);
  } else {
    renderGuestNav();
  }
}

async function renderAuthenticatedNav(user) {
  const userInfo = document.getElementById("userInfo");
  const testUsername = document.getElementById("testUsername");

  if (testUsername) {
    testUsername.textContent = user.username;
  }

  if (userInfo) {
    // Check if user is admin of any pools
    const token = localStorage.getItem("token");
    let isAdmin = false;

    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/pools/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const adminPools = await response.json();
          isAdmin = adminPools.length > 0;
        }
      } catch (err) {
        console.log("Error checking admin status:", err);
      }
    }

    const adminLink = isAdmin ? `<a href="admin.html">Admin</a>` : '';
    const adminDivider = isAdmin ? `<div class="dropdown-divider"></div>` : '';

    userInfo.innerHTML = `
      <button class="profile-button">
        ${user.displayName || user.username}
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="profile-dropdown">
        <a href="profile.html">Profile</a>
        ${adminDivider}
        ${adminLink}
        <div class="dropdown-divider"></div>
        <button onclick="showLogoutModal()">Sign Out</button>
      </div>
    `;
    setupProfileDropdown();
  }
}

function renderGuestNav() {
  const authButtons = document.getElementById("authButtons");
  if (authButtons) {
    authButtons.innerHTML = `
      <button onclick="showLoginModal()" class="auth-button login-button">Sign In</button>
      <a href="register.html" class="auth-button register-button">Sign Up</a>
    `;
  }
}

function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".navbar-menu a");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function setupProfileDropdown() {
  console.log("Setting up profile dropdown");
  const profileButton = document.querySelector(".profile-button");
  const dropdown = document.querySelector(".profile-dropdown");

  if (profileButton && dropdown) {
    console.log("Found profile button and dropdown");

    profileButton.addEventListener("click", (e) => {
      console.log("Profile button clicked");
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !profileButton.contains(e.target)) {
        dropdown.classList.remove("show");
      }
    });
  } else {
    console.log("Profile elements not found:", {
      buttonFound: !!profileButton,
      dropdownFound: !!dropdown,
    });
  }
}

export { updateActiveNavLink };
