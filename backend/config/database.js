import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDatabase() {
  const useEmbedded =
    process.env.USE_EMBEDDED_MONGO === 'true' ||
    process.env.MONGODB_URI === 'embedded';

  if (useEmbedded) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri('team-task-manager');
    await mongoose.connect(uri);
    console.log('MongoDB connected (embedded in-memory instance)');
    console.log(`  Data path: ${memoryServer.instanceInfo?.dbPath || 'temporary'}`);
    return;
  }

  const uri =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/team-task-manager';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;

    console.warn(`Local MongoDB unavailable (${err.message}). Starting embedded instance...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const embeddedUri = memoryServer.getUri('team-task-manager');
    await mongoose.connect(embeddedUri);
    console.log('MongoDB connected (embedded fallback — install MongoDB for persistent data)');
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
