import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';

// Load env variables
dotenv.config({ path: './.env' });
console.log("✅ TEST ENV:", process.env.EMAIL_USER);


// Connect Database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;