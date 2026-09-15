/**
 * Seeds Location Service with a set of fake online drivers scattered
 * around a real center point, so /locations/nearby has something
 * realistic to choose between during a demo or manual test.
 *
 * Usage:
 *   npm install axios @faker-js/faker --save-dev   (run once, in this scripts folder or project root)
 *   npx ts-node seed-drivers.ts
 *
 * Adjust LOCATION_SERVICE_URL, CENTER_LAT/LNG, and DRIVER_COUNT as needed.
 */

import axios from 'axios';
import { faker } from '@faker-js/faker';

const LOCATION_SERVICE_URL = 'http://localhost:3004';

// Kathmandu center point — swap for wherever you want the demo to look local
const CENTER_LAT = 27.7172;
const CENTER_LNG = 85.324;

const DRIVER_COUNT = 10;
const SPREAD_DEGREES = 0.03; // roughly ~1.5-2km spread around the center

interface SeededDriver {
  driverId: string;
  lat: number;
  lng: number;
}

async function seedDrivers(count: number): Promise<SeededDriver[]> {
  const seeded: SeededDriver[] = [];

  for (let i = 0; i < count; i++) {
    const driverId = `driver-${faker.string.alphanumeric(8)}`;
    const lat = CENTER_LAT + (Math.random() - 0.5) * SPREAD_DEGREES;
    const lng = CENTER_LNG + (Math.random() - 0.5) * SPREAD_DEGREES;

    try {
      await axios.patch(`${LOCATION_SERVICE_URL}/locations/driver/${driverId}/online`, {
        lat,
        lng,
      });
      seeded.push({ driverId, lat, lng });
      console.log(`Seeded ${driverId} at (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    } catch (err: any) {
      console.error(`Failed to seed ${driverId}:`, err.message);
    }
  }

  return seeded;
}

async function main() {
  console.log(`Seeding ${DRIVER_COUNT} drivers around (${CENTER_LAT}, ${CENTER_LNG})...`);
  const seeded = await seedDrivers(DRIVER_COUNT);
  console.log(`\nDone. Seeded ${seeded.length} drivers.`);
  console.log('\nTest a nearby query with:');
  console.log(
    `curl "${LOCATION_SERVICE_URL}/locations/nearby?lat=${CENTER_LAT}&lng=${CENTER_LNG}&radiusKm=5"`,
  );
}

main();