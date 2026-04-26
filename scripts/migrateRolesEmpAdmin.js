/**
 * One-time: map legacy roles to emp | admin
 *   employee -> emp
 *   hr       -> admin (keeps elevated access)
 * Run: node scripts/migrateRolesEmpAdmin.js
 * Requires MONGO_URI in .env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection('users');
  const r1 = await col.updateMany({ role: 'employee' }, { $set: { role: 'emp' } });
  const r2 = await col.updateMany({ role: 'hr' }, { $set: { role: 'admin' } });
  console.log('employee -> emp:', r1.modifiedCount);
  console.log('hr -> admin:', r2.modifiedCount);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
