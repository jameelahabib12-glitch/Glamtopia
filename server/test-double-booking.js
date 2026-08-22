/**
 * Task 4 — Adversarial double-booking self-test
 * -----------------------------------------------
 * Run this with the server already running locally (npm run dev in server/).
 *
 * What it does, automatically:
 *   1. Registers a fresh provider account
 *   2. Creates that provider's profile
 *   3. Creates one service under that provider
 *   4. Creates one availability slot under that provider
 *   5. Registers a fresh customer account
 *   6. Fires TWO booking requests for the SAME slot at (almost) the same time
 *   7. Prints both results so you can see one succeed (201) and one get
 *      rejected (409) — proving double-booking is actually prevented.
 *
 * HOW TO RUN:
 *   1. Save this file as server/test-double-booking.js
 *   2. In a terminal, inside the server folder, run:
 *        node test-double-booking.js
 *   3. Read the printed output at the bottom.
 */

const BASE = "http://localhost:5000/api";

// Random suffix so re-running this script doesn't collide with "email already
// registered" errors from a previous run.
const rand = Math.floor(Math.random() * 100000);

async function main() {
  console.log("=== Task 4: Adversarial Double-Booking Test ===\n");

  // ---- 1. Register provider ----
  console.log("1. Registering test provider...");
  const providerCookies = [];
  const registerProviderRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Provider",
      email: `provider${rand}@test.com`,
      password: "password123",
      role: "provider",
    }),
  });
  captureCookies(registerProviderRes, providerCookies);
  if (!registerProviderRes.ok) {
    console.error("FAILED at provider registration:", await registerProviderRes.text());
    return;
  }
  console.log("   -> provider registered and logged in\n");

  // ---- 2. Create provider profile ----
  console.log("2. Creating provider profile...");
  const profileRes = await fetch(`${BASE}/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: providerCookies.join("; ") },
    body: JSON.stringify({
      business_name: "Test Salon",
      location: "Test City",
      category: "hair",
      contact_info: "test@salon.com",
    }),
  });
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error("FAILED at profile creation:", profileData);
    return;
  }
  const providerId = profileData._id;
  console.log(`   -> provider profile created: ${providerId}\n`);

  // ---- 3. Create service ----
  console.log("3. Creating a service...");
  const serviceRes = await fetch(`${BASE}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: providerCookies.join("; ") },
    body: JSON.stringify({
      name: "Haircut",
      description: "Test service for double-booking check",
      duration_minutes: 60,
      price: 20,
    }),
  });
  const serviceData = await serviceRes.json();
  if (!serviceRes.ok) {
    console.error("FAILED at service creation:", serviceData);
    return;
  }
  const serviceId = serviceData._id;
  console.log(`   -> service created: ${serviceId}\n`);

  // ---- 4. Create availability slot ----
  console.log("4. Creating an availability slot...");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const slotRes = await fetch(`${BASE}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: providerCookies.join("; ") },
    body: JSON.stringify({ start_time: tomorrow }),
  });
  const slotData = await slotRes.json();
  if (!slotRes.ok) {
    console.error("FAILED at slot creation:", slotData);
    return;
  }
  const slotId = slotData._id;
  console.log(`   -> slot created: ${slotId}\n`);

  // ---- 5. Register customer ----
  console.log("5. Registering test customer...");
  const customerCookies = [];
  const registerCustomerRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Customer",
      email: `customer${rand}@test.com`,
      password: "password123",
      role: "customer",
      phone_number: "0300-1234567",
    }),
  });
  captureCookies(registerCustomerRes, customerCookies);
  if (!registerCustomerRes.ok) {
    console.error("FAILED at customer registration:", await registerCustomerRes.text());
    return;
  }
  console.log("   -> customer registered and logged in\n");

  // ---- 6. Fire two booking attempts for the SAME slot, nearly simultaneously ----
  console.log("6. Firing TWO simultaneous booking requests for the same slot...\n");

  const bookingBody = JSON.stringify({ serviceId, slotId });
  const bookingHeaders = { "Content-Type": "application/json", Cookie: customerCookies.join("; ") };

  const [resultA, resultB] = await Promise.all([
    fetch(`${BASE}/bookings`, { method: "POST", headers: bookingHeaders, body: bookingBody }),
    fetch(`${BASE}/bookings`, { method: "POST", headers: bookingHeaders, body: bookingBody }),
  ]);

  const dataA = await resultA.json();
  const dataB = await resultB.json();

  console.log("=== RESULTS ===");
  console.log(`Request A -> status ${resultA.status}:`, dataA.message || dataA);
  console.log(`Request B -> status ${resultB.status}:`, dataB.message || dataB);
  console.log("");

  const statuses = [resultA.status, resultB.status].sort();
  if (JSON.stringify(statuses) === JSON.stringify([201, 409])) {
    console.log("PASS: exactly one request succeeded (201) and one was correctly rejected (409).");
    console.log("Double-booking prevention is working.");
  } else {
    console.log("UNEXPECTED RESULT — statuses were:", statuses);
    console.log("Expected one 201 and one 409. Investigate before considering this task done.");
  }
}

// Helper: Node's fetch doesn't auto-manage cookies like a browser does,
// so we manually grab the session cookie from each response and reuse it
// on the next request (this is what keeps you "logged in" across calls).
function captureCookies(res, store) {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    store.push(setCookie.split(";")[0]);
  }
}

main().catch((err) => {
  console.error("Script crashed:", err);
});