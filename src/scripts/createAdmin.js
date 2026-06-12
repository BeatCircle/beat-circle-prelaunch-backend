/**
 * Usage:
 *   node src/scripts/createAdmin.js <username> <email> <password>
 *
 * Example:
 *   node src/scripts/createAdmin.js admin admin@beatcircle.com SuperSecret123
 */

import dotenv   from 'dotenv';
import mongoose from 'mongoose';
import Admin    from '../models/admin.model.js';

dotenv.config();

const [,, username = 'admin', email = 'admin@beatcircle.com', password = 'changeme!'] =
  process.argv;

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const existing = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existing) {
      console.log(`⚠️   An admin with that username or email already exists.`);
      process.exit(0);
    }

    const admin = new Admin({ username, email });
    admin.setPassword(password);
    await admin.save();

    console.log(`🎉  Admin created!`);
    console.log(`    Username : ${username}`);
    console.log(`    Email    : ${email}`);
    console.log(`    Password : (the one you provided)`);
    console.log(`\n🔒  Change your password after the first login.`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Error creating admin:', err.message);
    process.exit(1);
  }
})();
