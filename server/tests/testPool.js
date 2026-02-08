const axios = require("axios");

async function testPoolEndpoint() {
  try {
    console.log("Starting test...");
    const url = "http://127.0.0.1:3333/api/pool";
    console.log("Testing URL:", url);

    const response = await axios.get(url, {
      timeout: 5000, // 5 second timeout
      validateStatus: false, // Allow any status code
    });

    console.log("Status:", response.status);
    console.log("Data:", response.data);
  } catch (error) {
    console.log("Error type:", error.name);
    console.log("Error message:", error.message);

    if (error.code) {
      console.log("Error code:", error.code);
    }
  }
}

// Run the test
console.log("Test script started");
testPoolEndpoint()
  .then(() => {
    console.log("Test completed");
  })
  .catch((err) => {
    console.log("Test failed:", err.message);
  });
