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
