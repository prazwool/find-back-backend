/**
 * FindBack demo seed data.
 * Run from the backend repository: npm run seed
 * Safe to run repeatedly: existing users, listings, and requests are preserved.
 * Never run with a production database unless you explicitly accept demo data.
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Item from '../src/models/Item.js';
import Claim from '../src/models/Claim.js';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const DEMO_PASSWORD = 'Demo12345!';
const counts = { users: 0, listings: 0, requests: 0 };

const accounts = {
  demo: { name: 'Alex Morgan', email: 'demo@findback.dev' },
  visitor: { name: 'Jamie Rai', email: 'visitor@findback.dev' },
};

const listings = [
  { key: 'headphones', by: 'demo', type: 'lost', title: 'Black wireless headphones', category: 'Electronics', location: 'Near Lakeside, Pokhara', description: 'My black over-ear headphones went missing near the lakeside walking area. Small scratch on the right side.', daysAgo: 2 },
  { key: 'wallet', by: 'demo', type: 'found', title: 'Brown leather wallet', category: 'Accessories', location: 'New Road, Kathmandu', description: 'Found a brown leather wallet near the bus stop. Please describe the contents to verify ownership.', daysAgo: 3 },
  { key: 'backpack', by: 'demo', type: 'lost', title: 'Blue hiking backpack', category: 'Bags', location: 'Thamel, Kathmandu', description: 'Navy blue 25L hiking backpack with a small mountain keychain on the zipper.', daysAgo: 4 },
  { key: 'keys', by: 'demo', type: 'found', title: 'Silver key set', category: 'Keys', location: 'Pulchowk, Lalitpur', description: 'A set of three silver keys attached to a red fabric loop, found near the main gate.', daysAgo: 5 },
  { key: 'student-card', by: 'demo', type: 'lost', title: 'Student ID card holder', category: 'Documents', location: 'Baneshwor, Kathmandu', description: 'Transparent ID card holder with a blue strap. Lost while commuting to college.', daysAgo: 6 },
  { key: 'watch', by: 'demo', type: 'found', title: 'Analog wrist watch', category: 'Accessories', location: 'Mahendrapool, Pokhara', description: 'Found a black strap analog wristwatch at a cafe. Share the brand and dial details to identify it.', daysAgo: 7 },
  { key: 'tote', by: 'demo', type: 'lost', title: 'Cream canvas tote bag', category: 'Bags', location: 'Bhaktapur Durbar Square', description: 'Cream-colored canvas tote bag containing some books and a water bottle.', daysAgo: 8 },
  { key: 'hoodie', by: 'demo', type: 'found', title: 'Gray zip-up hoodie', category: 'Clothing', location: 'Chitwan, Bharatpur', description: 'Found a gray zip-up hoodie left on a bench. Tell me the logo on the chest to claim it.', daysAgo: 9 },
  { key: 'umbrella', by: 'visitor', type: 'found', title: 'Red folding umbrella', category: 'Other', location: 'Ratna Park, Kathmandu', description: 'A small red folding umbrella was left at the park entrance. It has a distinctive wooden handle.', daysAgo: 2, status: 'resolved' },
  { key: 'glasses', by: 'visitor', type: 'found', title: 'Black prescription glasses', category: 'Accessories', location: 'Chipledhunga, Pokhara', description: 'Prescription glasses in a blue hard case. Please describe the frame shape to confirm ownership.', daysAgo: 1 },
  { key: 'charger', by: 'visitor', type: 'lost', title: 'White laptop charger', category: 'Electronics', location: 'Civil Mall, Kathmandu', description: 'Lost a white USB-C laptop charger and cable near the food court tables.', daysAgo: 3 },
  { key: 'notebook', by: 'visitor', type: 'lost', title: 'Green university notebook', category: 'Documents', location: 'Prithvi Chowk, Pokhara', description: 'An A5 notebook with a green cover and handwritten class notes. My initials are inside.', daysAgo: 4 },
];

const requests = [
  { forItem: 'wallet', by: 'visitor', status: 'pending', message: 'I may have lost this wallet on New Road. It has a stitched inner card pocket and a small mark near the clasp.' },
  { forItem: 'watch', by: 'visitor', status: 'rejected', message: 'I recently misplaced a black wrist watch and wanted to check whether the found item might be mine.' },
  { forItem: 'umbrella', by: 'demo', status: 'approved', message: 'This sounds like my red umbrella. The handle is wooden and the strap has a little brass button.' },
  { forItem: 'glasses', by: 'demo', status: 'pending', message: 'I lost prescription glasses in a blue case near that area. The frames have a rounded rectangular shape.' },
];

async function ensureUser({ name, email }) {
  let user = await User.findOne({ email });
  if (user) return user;
  user = await User.create({ name, email, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12) });
  counts.users++;
  return user;
}

async function ensureListing(sample, owners) {
  // Match on owner + type + title to recognize listings from earlier seed versions.
  // Never overwrite user edits when reseeding.
  let item = await Item.findOne({ owner: owners[sample.by]._id, type: sample.type, title: sample.title });
  if (item) return item;
  const { type, title, category, location, description, daysAgo, status } = sample;
  item = await Item.create({
    owner: owners[sample.by]._id,
    type, title, category, location, description,
    occurredOn: new Date(Date.now() - daysAgo * 86_400_000),
    status: status || 'open',
  });
  counts.listings++;
  return item;
}

async function ensureRequest(sample, owners, items) {
  const item = items[sample.forItem];
  if (await Claim.exists({ item: item._id, claimant: owners[sample.by]._id })) return;
  await Claim.create({
    item: item._id,
    claimant: owners[sample.by]._id,
    message: sample.message,
    status: sample.status,
  });
  counts.requests++;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI. Copy backend/.env.example to backend/.env first.');
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to seed in production. Set ALLOW_DEMO_SEED=true only if you intentionally want demo data.');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
  const owners = {};
  for (const [key, account] of Object.entries(accounts)) owners[key] = await ensureUser(account);

  const items = {};
  for (const sample of listings) items[sample.key] = await ensureListing(sample, owners);
  for (const sample of requests) await ensureRequest(sample, owners, items);

  console.log(`Seed complete: ${counts.users} new users, ${counts.listings} new listings, ${counts.requests} new requests.`);
  console.log('Demo accounts (newly created accounts use password Demo12345!):');
  console.log('  demo@findback.dev    / Demo12345!');
  console.log('  visitor@findback.dev / Demo12345!');
  console.log('Existing account passwords and user-edited listings are not reset. Running this again will not duplicate seed records.');
}

try {
  await main();
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
