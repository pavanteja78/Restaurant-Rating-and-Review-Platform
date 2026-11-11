require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const Review = require('./models/Review');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
    await connectDB();
    // Make sure unique indexes (customer+restaurant, email, owner) exist.
    await Promise.all([User.init(), Restaurant.init(), Review.init()]);
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
