// Use relative URL for production (same origin), localhost for development
export const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3333"
  : "";

export const STATIC_URL = ""; // Empty string for same-origin requests
