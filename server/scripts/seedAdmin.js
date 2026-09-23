import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Setup env variables for local execution if running from root or server dir
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      console.error('Please provide ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const adminUser = new User({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      isVerified: true
    });

    await adminUser.save();
    console.log('Admin user seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
