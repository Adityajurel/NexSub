const mongoose = require('mongoose');
const env = require('./env');

let isReplicaSet = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Detect replica set support
    try {
      const adminDb = conn.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      if (status && status.ok === 1) {
        isReplicaSet = true;
        console.log('[MongoDB] Replica set detected. Multi-document transactions enabled.');
      } else {
        console.log('[MongoDB] Running in standalone mode. Fallback atomic operations enabled.');
      }
    } catch {
      isReplicaSet = false;
    }

    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Failed to connect: ${error.message}`);
    process.exit(1);
  }
};

const withTransaction = async (workFn) => {
  if (isReplicaSet) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await workFn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback: execute work directly
    return await workFn(null);
  }
};

module.exports = {
  connectDB,
  withTransaction,
  isReplicaSet: () => isReplicaSet
};
