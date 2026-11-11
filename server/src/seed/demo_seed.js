// DEMO DATA ONLY - for local demos and screen recordings.
// Do not run it before final testing, and do not mention it in the submission.
//
// What it does:
//   - creates any missing demo users (existing accounts are kept)
//   - DELETES all restaurants and reviews, then recreates the demo ones
// Usage (from /server):  node src/seed/demo-seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');

const USERS = [
  { name: 'Ava Admin', email: 'admin@tablemark.com', password: 'Admin@1234', role: 'admin' },
  { name: 'Omar Owner', email: 'owner@tablemark.com', password: 'Owner@1234', role: 'owner' },
  { name: 'Olivia Owner', email: 'olivia@tablemark.com', password: 'Owner@1234', role: 'owner' },
  { name: 'Chris Customer', email: 'customer@tablemark.com', password: 'Customer@1234', role: 'customer' },
  { name: 'Dana Diner', email: 'dana@tablemark.com', password: 'Customer@1234', role: 'customer' },
  { name: 'Evan Eater', email: 'evan@tablemark.com', password: 'Customer@1234', role: 'customer' },
  { name: 'Fatima Foodie', email: 'fatima@tablemark.com', password: 'Customer@1234', role: 'customer' },
];

const RESTAURANTS = [
  { name: 'Charminar Biryani House', location: 'Hyderabad', cuisine: 'Indian', address: '12 Old City Rd', phone: '+91 40 5550 1001', openingHours: 'Daily 11:00-23:00', description: 'Dum biryani cooked sealed in clay pots, with mirchi ka salan on the side.', owner: 'owner@tablemark.com' },
  { name: 'Banjara Spice Kitchen', location: 'Hyderabad', cuisine: 'Indian', address: '48 Road No. 12, Banjara Hills', phone: '+91 40 5550 1002', openingHours: 'Daily 12:00-22:30', description: 'North and South Indian regional thalis.' },
  { name: 'Trattoria Verde', location: 'Mumbai', cuisine: 'Italian', address: '5 Linking Rd, Bandra', phone: '+91 22 5550 2001', openingHours: 'Tue-Sun 12:00-23:00', description: 'Wood-fired pizza and hand-rolled pasta.', owner: 'olivia@tablemark.com' },
  { name: 'Sakura Counter', location: 'Mumbai', cuisine: 'Japanese', address: '21 Carter Rd', phone: '+91 22 5550 2002', openingHours: 'Daily 12:30-22:00', description: 'Eight-seat sushi counter with a daily omakase.' },
  { name: 'Taco Norte', location: 'Bengaluru', cuisine: 'Mexican', address: '77 Indiranagar 100ft Rd', phone: '+91 80 5550 3001', openingHours: 'Daily 11:30-23:30', description: 'Street-style tacos and house salsas.' },
  { name: 'La Petite Table', location: 'Bengaluru', cuisine: 'French', address: '9 Church St', phone: '+91 80 5550 3002', openingHours: 'Wed-Mon 18:00-23:00', description: 'Small bistro with a short, seasonal menu.' },
  { name: 'Golden Dragon', location: 'Delhi', cuisine: 'Chinese', address: '3 Connaught Place', phone: '+91 11 5550 4001', openingHours: 'Daily 12:00-23:00', description: 'Sichuan and Cantonese classics.' },
  { name: 'Olive & Ember', location: 'Delhi', cuisine: 'Mediterranean', address: '14 Hauz Khas Village', phone: '+91 11 5550 4002', openingHours: 'Daily 12:00-00:00', description: 'Charcoal grill, mezze and fresh breads.' },
];

// [restaurant, customer email, rating, comment]
const REVIEWS = [
  ['Charminar Biryani House', 'customer@tablemark.com', 5, 'Best biryani in the city, perfectly spiced.'],
  ['Charminar Biryani House', 'dana@tablemark.com', 5, 'Fragrant rice and tender meat. Worth the wait.'],
  ['Charminar Biryani House', 'evan@tablemark.com', 4, 'Great flavours, a little crowded at dinner.'],
  ['Charminar Biryani House', 'fatima@tablemark.com', 4, 'Generous portions and friendly staff.'],
  ['Trattoria Verde', 'customer@tablemark.com', 4, 'Excellent wood-fired pizza.'],
  ['Trattoria Verde', 'dana@tablemark.com', 3, 'Good pasta but slow service.'],
  ['Trattoria Verde', 'evan@tablemark.com', 5, 'The best tiramisu I have had in years.'],
  ['Sakura Counter', 'dana@tablemark.com', 5, 'Fresh fish and a wonderful omakase.'],
  ['Sakura Counter', 'fatima@tablemark.com', 4, 'Beautiful presentation, small but cosy.'],
  ['Taco Norte', 'customer@tablemark.com', 2, 'Tacos arrived lukewarm.'],
  ['Taco Norte', 'evan@tablemark.com', 3, 'Decent salsas, average tacos.'],
  ['Taco Norte', 'fatima@tablemark.com', 3, 'Fun place, mediocre food for the price.'],
  ['Golden Dragon', 'customer@tablemark.com', 3, 'Solid Sichuan dishes, nothing special.'],
];

(async () => {
  await connectDB();
  await Promise.all([User.init(), Restaurant.init(), Review.init()]);

  const users = {};
  for (const u of USERS) {
    users[u.email] = (await User.findOne({ email: u.email })) || (await User.create(u));
  }

  await Review.deleteMany({});
  await Restaurant.deleteMany({});

  const byName = {};
  for (const r of RESTAURANTS) {
    const { owner, ...rest } = r;
    byName[r.name] = await Restaurant.create({ ...rest, owner: owner ? users[owner]._id : null });
  }
  for (const [name, email, rating, comment] of REVIEWS) {
    await Review.create({ customer: users[email]._id, restaurant: byName[name]._id, rating, comment });
  }

  
  console.log(`Demo data loaded: ${Object.keys(users).length} users, ${RESTAURANTS.length} restaurants, ${REVIEWS.length} reviews.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });