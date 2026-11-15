import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT || 5000);
if (!process.env.MONGODB_URI) { console.error('Missing MONGODB_URI in backend/.env'); process.exit(1); }
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) { console.error('Set a strong JWT_SECRET (at least 32 characters) in backend/.env'); process.exit(1); }

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  const server = app.listen(port, () => console.log(`FindBack API ready at http://localhost:${port}`));
  const shutdown = async () => { server.close(); await mongoose.disconnect(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}
