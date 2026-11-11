
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const ACCOUNTS = [
  { name: 'Ava Admin', email: 'admin@tablemark.com', password: 'Admin@1234', role: 'admin' },
  { name: 'Omar Owner', email: 'owner@tablemark.com', password: 'Owner@1234', role: 'owner' },
  { name: 'Chris Customer', email: 'customer@tablemark.com', password: 'Customer@1234', role: 'customer' },
];

(async () => {
  await connectDB();
  await User.init();
  for (const a of ACCOUNTS) {
    if (await User.exists({ email: a.email })) {
      console.log(`exists   ${a.role.padEnd(8)} ${a.email}`);
    } else {
      await User.create(a); 
      console.log(`created  ${a.role.padEnd(8)} ${a.email}`);
    }
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });