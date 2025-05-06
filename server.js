// import dotenv from 'dotenv';
// import app from './src/app.js';
// import connectDB from './src/config/db.js';

// // Load env variables
// dotenv.config({ path: './.env' });

// // Connect Database
// connectDB();

// // Start server
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

// export default app;



// backend/server.js
// backend/server.js
import mongoose from 'mongoose';
import app      from './src/app.js';

const PORT = process.env.PORT||5000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})
  .then(() => {
    console.log('📦 MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });

// graceful shutdown…
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('🛑 MongoDB disconnected');
    process.exit(0);
  });
});
