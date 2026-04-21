/**
 * Copy every collection from source MongoDB (old cluster) to destination (new cluster).
 * Preserves _id and all fields (users, notifications, attendance, leaves, KPI, etc.)
 *
 * Usage:
 *   OLD_MONGO_URI="mongodb+srv://user:pass@old-host/workaholic?..." node scripts/migrateMongo.js
 *
 * Destination is read from MONGO_URI in .env (or pass MONGO_URI_DEST).
 *
 * Options:
 *   SKIP_CLEAR=1  — merge only (skip deleteMany before insert — may duplicate if re-run wrong)
 *
 * Defaults: clears each destination collection before inserting copies from source.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const SOURCE_URI = process.env.OLD_MONGO_URI || process.env.MONGO_URI_SOURCE;
const DEST_URI = process.env.MONGO_URI_DEST || process.env.MONGO_URI;
const SKIP_CLEAR = process.env.SKIP_CLEAR === '1';

async function migrate() {
  if (!SOURCE_URI) {
    console.error(`
Missing OLD_MONGO_URI (or MONGO_URI_SOURCE).

Example:
  OLD_MONGO_URI="mongodb+srv://user:pass@cluster/old-db/workaholic?retryWrites=true&w=majority" \\
  node scripts/migrateMongo.js
`);
    process.exit(1);
  }
  if (!DEST_URI) {
    console.error('Missing MONGO_URI in .env');
    process.exit(1);
  }
  if (SOURCE_URI === DEST_URI) {
    console.error('Source and destination URIs must differ.');
    process.exit(1);
  }

  console.log('Connecting to SOURCE...');
  const srcConn = await mongoose.createConnection(SOURCE_URI, {
    serverSelectionTimeoutMS: 30000,
  }).asPromise();

  console.log('Connecting to DESTINATION...');
  const dstConn = await mongoose.createConnection(DEST_URI, {
    serverSelectionTimeoutMS: 30000,
  }).asPromise();

  const dbSrc = srcConn.db;
  const dbDst = dstConn.db;

  const collections = await dbSrc.listCollections().toArray();
  const names = collections.map((c) => c.name).filter((n) => !n.startsWith('system.'));

  console.log(`Found ${names.length} collections on source: ${names.join(', ') || '(none)'}\n`);

  let totalDocs = 0;

  for (const name of names.sort()) {
    const colSrc = dbSrc.collection(name);
    const count = await colSrc.countDocuments();
    if (count === 0) {
      console.log(`[${name}] skip (empty)`);
      continue;
    }

    const docs = await colSrc.find({}).toArray();

    const colDst = dbDst.collection(name);

    if (!SKIP_CLEAR) {
      const del = await colDst.deleteMany({});
      console.log(`[${name}] cleared ${del.deletedCount} existing docs on destination`);
    }

    if (docs.length > 0) {
      await colDst.insertMany(docs, { ordered: false });
    }

    totalDocs += docs.length;
    console.log(`[${name}] migrated ${docs.length} document(s)`);
  }

  await srcConn.close();
  await dstConn.close();

  console.log(`\nDone. Total documents copied: ${totalDocs}`);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
