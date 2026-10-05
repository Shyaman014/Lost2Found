import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Item from '../models/Item.js';
import User from '../models/User.js';

dotenv.config();

const dummyItems = [
  {
    title: 'MacBook Pro 14" Silver',
    description: 'Found a silver MacBook Pro in the Library on the 2nd floor near the window seats. It has a few stickers on the back.',
    type: 'found',
    category: 'electronics',
    location: 'Library',
    date: new Date('2026-10-04'),
    time: '14:30',
    color: 'Silver',
    brand: 'Apple',
    identifyingDetails: 'Sticker of a cat on the back.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Black Leather Wallet with ID',
    description: 'Lost my black leather wallet somewhere near the cafeteria. It contains my student ID and some cash. Please let me know if found!',
    type: 'lost',
    category: 'wallet',
    location: 'Cafeteria',
    date: new Date('2026-10-02'),
    time: '12:00',
    color: 'Black',
    brand: 'Fossil',
    identifyingDetails: 'Has my student ID (John Doe) inside.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Blue Hydro Flask Water Bottle',
    description: 'Left my blue Hydro Flask in the Science Building, Room 302 after chemistry class.',
    type: 'lost',
    category: 'other',
    location: 'Science Building',
    date: new Date('2026-10-01'),
    time: '10:00',
    color: 'Blue',
    brand: 'Hydro Flask',
    identifyingDetails: 'Has a small dent on the bottom.',
    contactPreference: 'email',
    status: 'active',
  },
  {
    title: 'Gold Necklace with Pendant',
    description: 'Found a gold necklace with a small heart pendant on the campus lawn near the main fountain.',
    type: 'found',
    category: 'jewelry',
    location: 'Main Fountain',
    date: new Date('2026-10-03'),
    time: '16:45',
    color: 'Gold',
    brand: '',
    identifyingDetails: 'Heart pendant has an inscription on the back.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Yellow North Face Backpack',
    description: 'Lost my yellow backpack in the Student Union building. Contains my laptop and notebooks!',
    type: 'lost',
    category: 'bags',
    location: 'Student Union',
    date: new Date('2026-10-05'),
    time: '09:15',
    color: 'Yellow',
    brand: 'North Face',
    identifyingDetails: 'Has a keychain with a bear on the zipper.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Calculus Textbook (7th Edition)',
    description: 'Found a Calculus textbook left on a bench outside the math department.',
    type: 'found',
    category: 'books',
    location: 'Math Department',
    date: new Date('2026-09-30'),
    time: '11:30',
    color: 'Blue/White',
    brand: 'Cengage',
    identifyingDetails: 'Name "Sarah" is written on the inside cover.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Car Keys on Lanyard',
    description: 'Lost my Honda car keys attached to a red university lanyard. Dropped somewhere between the parking lot and the gym.',
    type: 'lost',
    category: 'keys',
    location: 'Gym / Parking Lot',
    date: new Date('2026-10-04'),
    time: '18:00',
    color: 'Red/Silver',
    brand: 'Honda',
    identifyingDetails: 'Red lanyard with university logo.',
    contactPreference: 'in_app',
    status: 'active',
  },
  {
    title: 'Ray-Ban Aviator Sunglasses',
    description: 'Found a pair of Ray-Ban sunglasses on a table in the outdoor seating area of the cafe.',
    type: 'found',
    category: 'accessories',
    location: 'Campus Cafe',
    date: new Date('2026-10-05'),
    time: '13:20',
    color: 'Gold/Green',
    brand: 'Ray-Ban',
    identifyingDetails: 'Small scratch on the left lens.',
    contactPreference: 'in_app',
    status: 'active',
  }
];

const seedItems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get a user to act as the reporter
    const user = await User.findOne({ email: 'demo@lost2found.app' });
    if (!user) {
      console.error('Demo user not found. Please log in once to create the demo user.');
      process.exit(1);
    }

    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');

    // Add reportedBy field to each item
    const itemsToInsert = dummyItems.map(item => ({
      ...item,
      reportedBy: user._id,
    }));

    // Insert new items
    await Item.insertMany(itemsToInsert);
    console.log(`Successfully seeded ${itemsToInsert.length} items`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
};

seedItems();
