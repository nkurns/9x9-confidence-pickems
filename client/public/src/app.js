import auth from "./auth.js"; // Ensure you have the correct import

function checkAuthState() {
  if (auth.isAuthenticated()) {
    // Show logged in content
    document.getElementById("loggedInContent").style.display = "block";
    document.getElementById("loggedOutContent").style.display = "none";
  } else {
    // Show logged out content
    document.getElementById("loggedInContent").style.display = "none";
    document.getElementById("loggedOutContent").style.display = "block";
  }
}

// Initialize the application when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  checkAuthState(); // Check authentication state on load
  // Initialize other components as needed
});
