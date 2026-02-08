const axios = require("axios");

async function testStandingsEndpoint() {
  try {
    console.log("Starting standings test...");
    const url = "http://127.0.0.1:3333/api/standings";
    console.log("Testing URL:", url);

    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: false,
    });

    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
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
testStandingsEndpoint()
  .then(() => {
    console.log("Test completed");
  })
  .catch((err) => {
    console.log("Test failed:", err.message);
  });
