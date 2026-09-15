/**
 * Proves the BUSY-driver fix works: requests two trips back-to-back
 * near the same driver and confirms the second trip either matches a
 * DIFFERENT driver, or correctly comes back with no match — never the
 * SAME driver who's already mid-trip on the first request.
 *
 * Requires: at least two seeded/online drivers nearby (run seed-drivers.ts
 * first), and the full chain running: Gateway, Auth, Trip, Location,
 * Matching services, plus Kafka.
 *
 * Usage:
 *   npx ts-node test-double-match.ts
 *
 * Edit GATEWAY_URL, EMAIL, PASSWORD, and the pickup coordinates below
 * to match your test setup.
 */

import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_RIDER_EMAIL || 'your-test-rider@example.com';
const PASSWORD = process.env.TEST_RIDER_PASSWORD || 'yourpassword';

const PICKUP = { lat: 27.7154, lng: 85.3123 };
const DROPOFF = { lat: 27.6766, lng: 85.3247 };

const WAIT_FOR_MATCH_MS = 4000; // give the outbox relay + Kafka round trip time to settle

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(): Promise<string> {
  const res = await axios.post(`${GATEWAY_URL}/auth/login`, {
    email: EMAIL,
    password: PASSWORD,
  });
  return res.data.accessToken;
}

async function requestTrip(token: string) {
  const res = await axios.post(
    `${GATEWAY_URL}/trips`,
    {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      dropoffLat: DROPOFF.lat,
      dropoffLng: DROPOFF.lng,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

async function getTrip(token: string, tripId: string) {
  const res = await axios.get(`${GATEWAY_URL}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function main() {
  console.log('Logging in...');
  const token = await login();

  console.log('\n--- Requesting trip #1 ---');
  const trip1 = await requestTrip(token);
  console.log(`Trip #1 created: ${trip1.id}`);

  console.log(`Waiting ${WAIT_FOR_MATCH_MS / 1000}s for matching...`);
  await wait(WAIT_FOR_MATCH_MS);

  const trip1Final = await getTrip(token, trip1.id);
  console.log(`Trip #1 status: ${trip1Final.status}, driver: ${trip1Final.driverId}`);

  console.log('\n--- Requesting trip #2 (same pickup area, immediately after) ---');
  const trip2 = await requestTrip(token);
  console.log(`Trip #2 created: ${trip2.id}`);

  console.log(`Waiting ${WAIT_FOR_MATCH_MS / 1000}s for matching...`);
  await wait(WAIT_FOR_MATCH_MS);

  const trip2Final = await getTrip(token, trip2.id);
  console.log(`Trip #2 status: ${trip2Final.status}, driver: ${trip2Final.driverId}`);

  console.log('\n--- Result ---');
  if (trip1Final.driverId && trip1Final.driverId === trip2Final.driverId) {
    console.log(
      `FAIL: both trips matched to the SAME driver (${trip1Final.driverId}) — the BUSY status isn't excluding a mid-trip driver from matching.`,
    );
  } else if (trip2Final.status === 'NO_DRIVER_FOUND') {
    console.log('PASS: trip #2 correctly found no available driver (all nearby drivers were busy/offline).');
  } else if (trip2Final.driverId) {
    console.log(
      `PASS: trip #2 matched a DIFFERENT driver (${trip2Final.driverId}) than trip #1 (${trip1Final.driverId}).`,
    );
  } else {
    console.log('Trip #2 is still unmatched — check services are running and try increasing WAIT_FOR_MATCH_MS.');
  }
}

main().catch((err) => {
  console.error('Test script failed:', err.response?.data || err.message);
});