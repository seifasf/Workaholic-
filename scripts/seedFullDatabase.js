/**
 * Ensures Seif, Zeina, Renad exist, then seeds notifications, attendance, leaves, and KPIs
 * so a fresh cluster behaves like a populated app.
 *
 * Run: node scripts/seedFullDatabase.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const KPIScore = require('../models/KPIScore');

const USERS = [
  { name: 'Seif', email: 'seif@workaholic.com', password: 'seif1234', role: 'emp', department: 'Engineering', position: 'Developer' },
  { name: 'Zeina', email: 'zeinasabry2211@gmail.com', password: 'zeina1234', role: 'emp', department: 'Operations', position: 'Analyst' },
  { name: 'Renad', email: 'renad@workaholic.com', password: 'renad1234', role: 'admin', department: 'HR', position: 'Administrator' },
];

const dayStr = (d) => d.toISOString().slice(0, 10);

async function ensureUsers() {
  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log('Created user:', u.email);
    } else {
      console.log('Existing user:', u.email);
    }
  }
  const seif = await User.findOne({ email: 'seif@workaholic.com' });
  const zeina = await User.findOne({ email: 'zeinasabry2211@gmail.com' });
  const renad = await User.findOne({ email: 'renad@workaholic.com' });
  return { seif, zeina, renad };
}

async function seedData(ids) {
  const { seif, zeina, renad } = ids;
  if (!seif || !zeina || !renad) throw new Error('Missing users');

  await Notification.deleteMany({});
  await AttendanceRecord.deleteMany({});
  await LeaveRequest.deleteMany({});
  await KPIScore.deleteMany({});

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const notifications = [
    { userId: seif._id, message: 'Welcome to Workaholic — clock in when you arrive at the office.', type: 'general', read: false },
    { userId: seif._id, message: 'Your attendance for this month is being tracked automatically.', type: 'kpi-update', read: true },
    { userId: zeina._id, message: 'Remember to submit leave requests at least 2 days in advance.', type: 'general', read: false },
    { userId: zeina._id, message: 'Monthly KPI scores will be available on the 1st.', type: 'kpi-update', read: false },
    { userId: renad._id, message: 'Seif has a pending leave request awaiting your review.', type: 'general', read: false },
    { userId: renad._id, message: 'Zeina clocked in late yesterday — review if needed.', type: 'late-alert', read: true },
  ];
  await Notification.insertMany(notifications);
  console.log(`Inserted ${notifications.length} notifications`);

  const attendanceDocs = [];
  const mkDay = (offset, userId, status, lateMin = 0, hours = 8) => {
    const d = new Date(y, m, now.getDate() + offset);
    const date = dayStr(d);
    const baseIn = new Date(d);
    baseIn.setHours(9, lateMin, 0, 0);
    const baseOut = new Date(baseIn);
    baseOut.setHours(baseIn.getHours() + hours, 0, 0, 0);
    attendanceDocs.push({
      userId,
      date,
      clockIn: { time: baseIn },
      clockOut: { time: baseOut },
      locationVerified: true,
      gpsVerified: true,
      ipVerified: true,
      hoursWorked: hours,
      latenessMinutes: lateMin,
      status,
    });
  };

  // Last 5 weekdays-ish sample for Seif (mix on-time / late)
  mkDay(-5, seif._id, 'on-time', 0);
  mkDay(-4, seif._id, 'late', 12);
  mkDay(-3, seif._id, 'on-time', 0);
  mkDay(-2, seif._id, 'on-time', 0);
  mkDay(-1, seif._id, 'early-leave', 0, 6);

  mkDay(-5, zeina._id, 'on-time', 0);
  mkDay(-4, zeina._id, 'on-time', 0);
  mkDay(-3, zeina._id, 'late', 25);
  mkDay(-2, zeina._id, 'on-time', 0);

  await AttendanceRecord.insertMany(attendanceDocs);
  console.log(`Inserted ${attendanceDocs.length} attendance records`);

  const leaves = [
    {
      userId: seif._id,
      type: 'vacation',
      startDate: new Date(y, m, now.getDate() + 7),
      endDate: new Date(y, m, now.getDate() + 9),
      daysRequested: 3,
      reason: 'Family trip',
      status: 'pending',
    },
    {
      userId: zeina._id,
      type: 'sick',
      startDate: new Date(y, m - 1, 15),
      endDate: new Date(y, m - 1, 16),
      daysRequested: 2,
      reason: 'Medical appointment',
      status: 'approved',
      adminComment: 'Approved — get well soon.',
      reviewedBy: renad._id,
      reviewedAt: new Date(y, m - 1, 14),
    },
    {
      userId: zeina._id,
      type: 'vacation',
      startDate: new Date(y, m + 1, 1),
      endDate: new Date(y, m + 1, 5),
      daysRequested: 5,
      reason: 'Summer leave',
      status: 'pending',
    },
  ];
  await LeaveRequest.insertMany(leaves);
  console.log(`Inserted ${leaves.length} leave requests`);

  const kpis = [
    {
      userId: seif._id,
      month: m + 1,
      year: y,
      punctualityScore: 82,
      attendanceScore: 88,
      leaveDeductionScore: 90,
      totalScore: 86,
      daysPresent: 18,
      daysAbsent: 1,
      totalLatenessMinutes: 45,
      workingDays: 22,
    },
    {
      userId: zeina._id,
      month: m + 1,
      year: y,
      punctualityScore: 91,
      attendanceScore: 92,
      leaveDeductionScore: 95,
      totalScore: 92,
      daysPresent: 19,
      daysAbsent: 0,
      totalLatenessMinutes: 25,
      workingDays: 22,
    },
  ];
  await KPIScore.insertMany(kpis);
  console.log(`Inserted ${kpis.length} KPI scores for ${y}-${String(m + 1).padStart(2, '0')}`);
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const ids = await ensureUsers();
  await seedData(ids);
  console.log('\nFull database seed completed.');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
