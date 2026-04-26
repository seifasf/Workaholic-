/**
 * One-time: set role "admin" for any user still on legacy "hr".
 * Run: node scripts/migrateHrToAdmin.js
 * Requires MONGO_URI in .env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  // Use raw collection so legacy "hr" values still match after enum changed on the model.
  const r = await mongoose.connection.db
    .collection('users')
    .updateMany({ role: 'hr' }, { $set: { role: 'admin' } });
  console.log('Updated users (hr -> admin):', r.modifiedCount);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
