/**
 * Seed default users. Run: node scripts/seedUsers.js
 * Requires MONGO_URI in ../.env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const users = [
  {
    name: 'Seif',
    email: 'seif@workaholic.com',
    password: 'seif1234',
    role: 'employee',
    department: 'Engineering',
    position: 'Developer',
  },
  {
    name: 'Zeina',
    email: 'zeinasabry2211@gmail.com',
    password: 'zeina1234',
    role: 'employee',
    department: 'Operations',
    position: 'Analyst',
  },
  {
    name: 'Renad',
    email: 'renad@workaholic.com',
    password: 'renad1234',
    role: 'admin',
    department: 'HR',
    position: 'Administrator',
  },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const emails = users.map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });
  for (const u of users) {
    await User.create(u);
    console.log('Created:', u.name, `(${u.email})`, '—', u.role);
  }
  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
