import { API_URL } from "./config.js";
import auth from "./auth.js";

class Dashboard {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.initializeDashboard()
        );
      } else {
        await this.initializeDashboard();
      }
    } catch (error) {
      console.error("Dashboard initialization error:", error);
    }
  }

  async initializeDashboard() {
    // Check if we're on the index page
    if (
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html"
    ) {
      // If on index, only proceed with auth check if user exists
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        await this.checkAuthState();
      } else {
        // Show guest content without redirecting
        this.showGuestContent();
      }
    } else {
      // For other pages, proceed with normal auth check
      await this.checkAuthState();
    }
  }

  async checkAuthState() {
    console.log("Checking authentication state...");
    if (!auth.isAuthenticated()) {
      // Only redirect if not on index page
      if (
        window.location.pathname !== "/" &&
        window.location.pathname !== "/index.html"
      ) {
        window.location.href = "/";
      }
      return;
    }
    console.log("User is authenticated.");
    await this.updateDashboardContent();
  }

  async updateDashboardContent() {
    try {
      // Get active pool first
      const token = localStorage.getItem("token");
      const poolResponse = await fetch(`${API_URL}/api/pool/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!poolResponse.ok) {
        throw new Error("Failed to fetch pool data");
      }

      const activePool = await poolResponse.json();
      const poolTitleElement = document.getElementById("poolTitle");
      if (poolTitleElement) {
        poolTitleElement.textContent = `You are participating in the ${activePool.name} pool:`;
      }

      await Promise.all([updatePicksStatus(), updateUpcomingGames()]);
    } catch (error) {
      console.error("Error updating dashboard content:", error);
    }
  }

  showGuestContent() {
    console.log("Showing guest content");
    const guestContent = document.getElementById("loggedOutContent");
    const authContent = document.getElementById("loggedInContent");

    if (guestContent) guestContent.style.display = "block";
    if (authContent) authContent.style.display = "none";
  }
}

// Dashboard content update functions
async function updatePicksStatus() {
  try {
    const token = localStorage.getItem("token");
    console.log("Fetching picks status...");

    const response = await fetch(`${API_URL}/api/picks/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Picks status response:", response);
    if (!response.ok) {
      throw new Error("Failed to fetch picks status");
    }

    const status = await response.json();
    console.log("Picks status data:", status);
    const { pickedGames, totalGames } = status;

    const statusElement = document.getElementById("picksStatus");
    if (!statusElement) {
      console.log(
        "picksStatus element not found - likely not on dashboard page"
      );
      return;
    }
    statusElement.textContent = `${pickedGames} picks have been entered for ${totalGames} upcoming games.`;

    const actionButtonContainer = document.getElementById("picksActionButton");
    if (!actionButtonContainer) {
      console.log(
        "picksActionButton element not found - likely not on dashboard page"
      );
      return;
    }
    if (pickedGames / totalGames === 1) {
      actionButtonContainer.innerHTML = `
        <a href="picks-summary.html" class="action-button primary-action">View Picks</a>
      `;
    } else {
      actionButtonContainer.innerHTML = `
        <a href="make-picks.html" class="action-button primary-action">Make Picks</a>
      `;
    }
  } catch (error) {
    console.error("Error updating picks status:", error);
  }
}

async function updateUpcomingGames() {
  try {
    const token = localStorage.getItem("token");
    console.log("Fetching upcoming games...");

    const response = await fetch(`${API_URL}/api/games/upcoming`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Upcoming games response:", response);
    if (!response.ok) {
      throw new Error("Failed to fetch upcoming games");
    }

    const games = await response.json();
    console.log("Upcoming games data:", games);
    const gamesContainer = document.getElementById("upcomingGames");

    if (!gamesContainer) {
      console.log(
        "upcomingGames element not found - likely not on dashboard page"
      );
      return;
    }

    if (games.length === 0) {
      gamesContainer.innerHTML =
        '<p class="no-games">No upcoming games scheduled</p>';
      return;
    }

    gamesContainer.innerHTML = games
      .map((game) => {
        const gameDate = new Date(game.gameTime);
        const formattedDate = gameDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York",
        });

        return `
          <div class="game-item">
            <div class="game-date">${formattedDate} ET</div>
            <div class="game-teams">${game.awayTeam} @ ${game.homeTeam}</div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error updating upcoming games:", error);
  }
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    if (auth.isAuthenticated()) {
      await Promise.all([updatePicksStatus(), updateUpcomingGames()]);
    }
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}

// Create dashboard instance when document is ready
const dashboard = new Dashboard();

// Export functions and dashboard instance
export {
  initializeDashboard,
  updatePicksStatus,
  updateUpcomingGames,
  dashboard,
};
