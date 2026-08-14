const mongoose = require("mongoose");

// Cache the connection across invocations.
// This matters on Vercel: serverless functions can reuse a "warm" instance,
// and without caching we'd open a new MongoDB connection on every request,
// which burns through Atlas's connection limit fast (see SRS 6 & 7).
let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    cached.promise = mongoose
      .connect(uri, {
        // Modern mongoose (6+) doesn't need useNewUrlParser/useUnifiedTopology,
        // kept here as a comment for anyone coming from older tutorials.
      })
      .then((mongooseInstance) => {
        console.log("MongoDB connected");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next call
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
