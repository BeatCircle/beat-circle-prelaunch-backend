import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set in environment variables.');
    console.error('    Add it to your .env file or hosting dashboard and restart.');
    return; // Don't crash — let the server start so routes respond with a clear error
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection failed: ${error.message}`);
    console.error('    Check your MONGODB_URI and make sure your IP is whitelisted in Atlas.');
    // Retry after 5 seconds instead of crashing
    console.log('🔄  Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
