import { API_URL } from "./config.js";

class Auth {
  constructor() {
    console.log("Auth class initialized");
    // Bind methods after they're defined
    this.login = this.login.bind(this);
    this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
    this.showLoginModal = this.showLoginModal.bind(this);
    this.closeLoginModal = this.closeLoginModal.bind(this);
    this.showLogoutModal = this.showLogoutModal.bind(this);
    this.closeLogoutModal = this.closeLogoutModal.bind(this);
    this.logoutUser = this.logoutUser.bind(this);
    this.register = this.register.bind(this);
    this.checkAuthState = this.checkAuthState.bind(this);
  }

  async checkAuthState() {
    console.log("Checking authentication state...");
    const token = localStorage.getItem("token");
    console.log("Token in localStorage:", token ? "Present" : "Not present");

    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds

      if (Date.now() >= expiry) {
        console.log("Token expired, attempting refresh...");
        return await this.refreshToken();
      }

      const userData = JSON.parse(localStorage.getItem("user"));
      console.log("User data from localStorage:", userData);
      return true;
    } catch (error) {
      console.error("Auth state check failed:", error);
      return false;
    }
  }

  async refreshToken() {
    try {
      const currentToken = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const { token, user } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.logout();
      return false;
    }
  }

  isAuthenticated() {
    console.log("Checking authentication state...");
    const token = localStorage.getItem("token");
    console.log("Token in localStorage:", token ? "Present" : "Missing");

    if (!token) {
      console.log("No token found, user is not authenticated");
      return false;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("User data from localStorage:", user);

      const isAuth = !!(user && user.id);
      console.log("Authentication result:", isAuth);
      return isAuth;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return false;
    }
  }

  async login(email, password) {
    console.log("Starting login attempt for email:", email);
    try {
      const requestBody = { email, password };
      console.log("Sending login request to:", `${API_URL}/api/auth/login`);
      console.log("Request body:", { ...requestBody, password: "[HIDDEN]" });

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Login response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login failed:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful, parsed response:", {
        ...data,
        token: data.token ? "[PRESENT]" : "[MISSING]",
        user: data.user
          ? {
              ...data.user,
              id: data.user.id || "[MISSING]",
              username: data.user.username || "[MISSING]",
            }
          : "[MISSING]",
      });

      // Store user data before reloading
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verify data was stored
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const storedToken = localStorage.getItem("token");
      console.log("Stored data verification:", {
        userStored: !!storedUser,
        userData: storedUser,
        tokenStored: !!storedToken,
      });

      return data;
    } catch (error) {
      console.error("Login error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async handleLoginSubmit(event) {
    event.preventDefault();
    console.log("Login form submitted");

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("password").value;

    try {
      const data = await this.login(email, password);
      console.log("Login response data:", {
        ...data,
        token: data.token ? "Present" : "Missing",
        user: data.user ? { ...data.user, id: data.user.id } : "Missing",
      });

      // Store auth data first
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Stored auth data:", {
        token: !!localStorage.getItem("token"),
        user: JSON.parse(localStorage.getItem("user")),
      });

      // Close modal before redirect
      this.closeLoginModal();

      // Redirect based on pool participation
      if (!data.user.hasPoolParticipation) {
        console.log(
          "User has no pool participation, redirecting to pool selection"
        );
        window.location.href = "/select-pools.html";
      } else {
        console.log("User has pool participation, redirecting to make picks");
        window.location.href = "/make-picks.html";
      }
    } catch (error) {
      console.error("Login failed:", error);
      const errorDiv = document.getElementById("loginError");
      if (errorDiv) {
        errorDiv.textContent =
          error.message || "Login failed. Please check your credentials.";
        errorDiv.style.display = "block";
      }
    }
  }

  showLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
    }
  }

  closeLoginModal() {
    console.log("Closing login modal");
    const modal = document.getElementById("loginModal");
    if (!modal) {
      console.error("Login modal element not found!");
      return;
    }
    modal.style.display = "none";
  }

  showLogoutModal() {
    document.getElementById("logoutModal").style.display = "flex";
  }

  closeLogoutModal() {
    document.getElementById("logoutModal").style.display = "none";
  }

  logoutUser() {
    console.log("Logging out user...");
    // Clear auth data
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Remove any modal that might be open
    const modal = document.querySelector(".modal-overlay");
    if (modal) {
      modal.remove();
    }

    // Redirect to home page
    window.location.href = "/";
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      // After successful registration, log the user in
      await this.login(userData.username, userData.password);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log("Testing API connection...");
      const response = await fetch(`${API_URL}/api/auth/test`);
      const data = await response.json();
      console.log("API test response:", data);
      return data;
    } catch (error) {
      console.error("API test failed:", error);
      throw error;
    }
  }

  async debugLogin(username, password) {
    console.log("=== Starting Debug Login Process ===");
    console.log("1. Testing API connection...");

    try {
      await this.testConnection();
      console.log("API connection successful");
    } catch (error) {
      console.error("API connection failed:", error);
      return;
    }

    console.log("2. Checking current auth state:");
    console.log("- Token exists:", !!localStorage.getItem("token"));
    console.log("- User exists:", !!localStorage.getItem("user"));

    console.log("3. Attempting login...");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("4. Raw response received:");
      console.log("- Status:", response.status);
      console.log("- Status Text:", response.statusText);
      console.log("- Headers:", Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log("5. Raw response body:", text);

      let data;
      try {
        data = JSON.parse(text);
        console.log("6. Parsed response data:", {
          ...data,
          token: data.token ? "[PRESENT]" : "[MISSING]",
        });
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
      }

      return { response, text, data };
    } catch (error) {
      console.error("7. Network or other error:", error);
    }
    console.log("=== Debug Login Process Complete ===");
  }

  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}

// Create and export a single instance
const auth = new Auth();
// Make showLoginModal globally available
window.showLoginModal = () => auth.showLoginModal();

export default auth;
