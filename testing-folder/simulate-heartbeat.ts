/**
 * Simulates a single driver's phone sending periodic GPS pings, so you
 * can watch a driver stay ONLINE in real time, and watch them drop out
 * of matching if you stop this script and wait past the TTL (30s).
 *
 * Usage:
 *   npx ts-node simulate-heartbeat.ts [driverId]
 *
 * Stop with Ctrl+C. Wait 30+ seconds, then query /locations/nearby
 * again — this driver should no longer appear.
 */

import axios from 'axios';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:3004';
const PING_INTERVAL_MS = 4000; // matches the ~3-4s real-world ping cadence from the HLD doc

const driverId = process.argv[2] || 'driver-demo-heartbeat';

// Start near central Kathmandu; small jitter per tick simulates movement
let lat = 27.7154;
let lng = 85.3123;

function jitter(): number {
  return (Math.random() - 0.5) * 0.0008; // small realistic street-level movement
}

async function ping() {
  lat += jitter();
  lng += jitter();

  try {
    await axios.patch(`${LOCATION_SERVICE_URL}/locations/driver/${driverId}`, { lat, lng });
    console.log(`[${new Date().toLocaleTimeString()}] ${driverId} pinged: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
  } catch (err: any) {
    console.error(`Ping failed for ${driverId}:`, err.message);
  }
}

console.log(`Starting heartbeat for ${driverId}, every ${PING_INTERVAL_MS / 1000}s. Ctrl+C to stop.`);
ping(); // fire immediately, then on the interval
setInterval(ping, PING_INTERVAL_MS);