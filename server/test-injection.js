/**
 * Quick test: confirms the login route rejects NoSQL injection attempts
 * instead of accepting them or crashing.
 *
 * HOW TO RUN:
 *   1. Make sure your server is running (npm run dev, in a separate terminal)
 *   2. Save this file as server/test-injection.js
 *   3. In a terminal, inside the server folder, run:
 *        node test-injection.js
 */

const BASE = "http://localhost:5000/api";

async function main() {
  console.log("=== NoSQL Injection Guard Test ===\n");

  console.log("Sending malicious login attempt: { email: {$gt:''}, password: {$gt:''} }");

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: { $gt: "" }, password: { $gt: "" } }),
  });

  const data = await res.json();

  console.log(`\nResponse status: ${res.status}`);
  console.log("Response body:", data);

  console.log("\n=== RESULT ===");
  if (res.status === 400 && data.message === "Invalid input format") {
    console.log("PASS: injection attempt was correctly rejected with a clean 400 error.");
  } else if (res.status === 200) {
    console.log("FAIL: the request SUCCEEDED — this is a real, serious vulnerability. Do not ship this.");
  } else {
    console.log(`UNEXPECTED: got status ${res.status} instead of the expected 400. Investigate before considering this fixed.`);
  }
}

main().catch((err) => {
  console.error("Script crashed:", err);
});