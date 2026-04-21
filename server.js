require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const connectDB = require('./config/db');
const { computeAllKPIs } = require('./services/kpiEngine');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const kpiRoutes = require('./routes/kpi');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

if (process.env.NODE_ENV === 'production') {
  const need = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('FATAL: Set these env vars on Render:', missing.join(', '));
    process.exit(1);
  }
}

/** Comma-separated frontends, e.g. Vercel prod + preview: https://a.vercel.app,https://b.vercel.app */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOriginFn = (origin, cb) => {
  if (!origin) return cb(null, true);
  if (allowedOrigins.includes(origin)) return cb(null, true);
  console.warn('CORS blocked origin:', origin);
  cb(null, false);
};

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(helmet());
app.use(cors({ origin: corsOriginFn, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// Monthly KPI cron: runs on the 1st of each month at 00:05
cron.schedule('5 0 1 * *', async () => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  console.log(`Running monthly KPI for ${prevMonth}/${year}`);
  await computeAllKPIs(prevMonth, year);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.BIND_HOST || '0.0.0.0';

connectDB().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
});
