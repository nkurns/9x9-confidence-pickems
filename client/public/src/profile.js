class Profile {
  constructor() {
    this.serverUrl = "http://localhost:3333";
    this.loadProfile();
    this.setupEventListeners();
  }

  async loadProfile() {
    try {
      const response = await fetch(`${this.serverUrl}/api/user/profile`, {
        headers: window.auth.getAuthHeaders(),
      });
      const profile = await response.json();
      this.populateForm(profile);
      this.loadPoolHistory();
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  populateForm(profile) {
    document.getElementById("displayName").value = profile.displayName || "";
    document.getElementById("email").value = profile.email || "";
    document.getElementById("location").value = profile.location || "";
  }

  async loadPoolHistory() {
    try {
      const response = await fetch(`${this.serverUrl}/api/user/pools/history`, {
        headers: window.auth.getAuthHeaders(),
      });
      const history = await response.json();
      this.displayPoolHistory(history);
    } catch (error) {
      console.error("Error loading pool history:", error);
    }
  }

  displayPoolHistory(history) {
    const container = document.getElementById("poolHistory");
    if (history.length === 0) {
      container.innerHTML = "<p>No pool history yet</p>";
      return;
    }

    container.innerHTML = history
      .map(
        (pool) => `
            <div class="pool-entry">
                <h3>${pool.name}</h3>
                <p>Season: ${pool.season}</p>
                <p>Final Rank: ${pool.rank || "In Progress"}</p>
                <p>Points: ${pool.points || 0}</p>
            </div>
        `
      )
      .join("");
  }

  setupEventListeners() {
    document
      .getElementById("profileForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.saveProfile();
      });
  }

  async saveProfile() {
    try {
      const profileData = {
        displayName: document.getElementById("displayName").value,
        email: document.getElementById("email").value,
        location: document.getElementById("location").value,
      };

      const response = await fetch(`${this.serverUrl}/api/user/profile`, {
        method: "PUT",
        headers: window.auth.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        alert("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile changes");
    }
  }
}

// Initialize profile
document.addEventListener("DOMContentLoaded", () => {
  new Profile();
});
