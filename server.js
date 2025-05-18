// backend/server.js
import mongoose from 'mongoose';
import app      from './src/app.js';



console.log('📦 Loaded ENV:');
console.log('  CLIENT_URL           =', process.env.CLIENT_URL);
console.log('  FRONTEND_URL         =', process.env.FRONTEND_URL);
console.log('  SERVER_URL           =', process.env.SERVER_URL);
console.log('  GITHUB_CALLBACK_URL  =', process.env.GITHUB_CALLBACK_URL);
console.log('  GITHUB_CLIENT_ID     =', process.env.GITHUB_CLIENT_ID);
console.log('  GITHUB_CLIENT_SECRET =', process.env.GITHUB_CLIENT_SECRET);
console.log('  GOOGLE_CLIENT_ID     =', process.env.GOOGLE_CLIENT_ID);
console.log('  GOOGLE_CLIENT_SECRET =', process.env.GOOGLE_CLIENT_SECRET);
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
