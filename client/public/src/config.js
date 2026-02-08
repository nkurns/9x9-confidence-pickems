export const API_URL = "http://localhost:3333";

export const STATIC_URL = (() => {
  const url = ""; // Empty string for same-origin requests
  console.log("STATIC_URL configured as:", url);
  return url;
})();
