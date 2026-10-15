import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Item from '../models/Item.js';
import User from '../models/User.js';

dotenv.config();

const dummyItems = [
  {
    title: 'MacBook Pro 14" Silver M2',
    description: 'Found a silver MacBook Pro in the Library on the 2nd floor near the window desks. It has a distinctive developer sticker on the back.',
    type: 'found',
    category: 'electronics',
    location: 'Main Campus Library',
    date: new Date('2026-10-10'),
    time: '14:30',
    color: 'Silver',
    brand: 'Apple',
    identifyingDetails: 'Has sticker of a cat on the back.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    },
  },
  {
    title: 'Apple AirPods Pro (2nd Gen)',
    description: 'Lost my AirPods Pro in white wireless charging case near the Student Union food court. Please contact me if spotted!',
    type: 'lost',
    category: 'electronics',
    location: 'Student Union Food Court',
    date: new Date('2026-10-11'),
    time: '13:15',
    color: 'White',
    brand: 'Apple',
    identifyingDetails: 'Case has a transparent protective shell with a scratch.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
    },
  },
  {
    title: 'Black Leather Bifold Wallet',
    description: 'Lost my black Fossil leather wallet near the campus cafeteria. Contains student ID card and bus pass. Cash can be kept as reward!',
    type: 'lost',
    category: 'wallet',
    location: 'Central Cafeteria',
    date: new Date('2026-10-09'),
    time: '12:00',
    color: 'Black',
    brand: 'Fossil',
    identifyingDetails: 'Has university student ID inside.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
    },
  },
  {
    title: 'Blue Hydro Flask 32oz Water Bottle',
    description: 'Found an insulated blue Hydro Flask water bottle left behind in Science Building Room 302 after Chemistry class.',
    type: 'found',
    category: 'other',
    location: 'Science Building Room 302',
    date: new Date('2026-10-10'),
    time: '11:00',
    color: 'Blue',
    brand: 'Hydro Flask',
    identifyingDetails: 'Slight ding on bottom rim, straw lid.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    },
  },
  {
    title: 'Yellow North Face Backpack',
    description: 'Lost my yellow North Face backpack. Contains notebook, binder, and pencil case. Critical study notes inside for midterms!',
    type: 'lost',
    category: 'bags',
    location: 'Engineering Hall',
    date: new Date('2026-10-08'),
    time: '09:15',
    color: 'Yellow',
    brand: 'The North Face',
    identifyingDetails: 'Brown bear plush keychain on main zipper.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    },
  },
  {
    title: 'Car Keys on University Lanyard',
    description: 'Found a set of Honda vehicle keys attached to a red woven university lanyard on the bench outside the athletic gym.',
    type: 'found',
    category: 'keys',
    location: 'Campus Recreation Center',
    date: new Date('2026-10-11'),
    time: '17:45',
    color: 'Red/Silver',
    brand: 'Honda',
    identifyingDetails: 'Has a small gym tag and black key fob.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80',
    },
  },
  {
    title: 'Calculus: Early Transcendentals Textbook',
    description: 'Found a hardcover Calculus textbook sitting on a table in the Math Department study lounge.',
    type: 'found',
    category: 'books',
    location: 'Math Department Lounge',
    date: new Date('2026-10-07'),
    time: '15:20',
    color: 'Blue/White',
    brand: 'Stewart',
    identifyingDetails: 'Post-it notes sticking out of chapter 6.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
    },
  },
  {
    title: 'Ray-Ban Aviator Classic Sunglasses',
    description: 'Lost my gold-framed Ray-Ban aviator sunglasses. Likely left them on the outdoor patio table near the campus coffee shop.',
    type: 'lost',
    category: 'accessories',
    location: 'Campus Coffee Patio',
    date: new Date('2026-10-09'),
    time: '14:10',
    color: 'Gold/Green',
    brand: 'Ray-Ban',
    identifyingDetails: 'Slight scratch near the right nose pad.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    },
  },
  {
    title: 'Gold Heart Pendant Necklace',
    description: 'Found a delicate gold necklace with a small heart pendant on the lawn path near the campus clock tower.',
    type: 'found',
    category: 'jewelry',
    location: 'Clock Tower Walkway',
    date: new Date('2026-10-10'),
    time: '16:30',
    color: 'Gold',
    brand: 'Unknown',
    identifyingDetails: 'Tiny inscription on the back of the heart.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    },
  },
  {
    title: 'Student ID Card & Dorm Access Badge',
    description: 'Found an official student ID card with magnetic dorm key fob on the floor of Lecture Hall 101.',
    type: 'found',
    category: 'documents',
    location: 'Lecture Hall 101',
    date: new Date('2026-10-12'),
    time: '10:45',
    color: 'White/Blue',
    brand: 'Campus Security',
    identifyingDetails: 'Photo matches a sophomore undergraduate.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80',
    },
  },
  {
    title: 'iPad Air 10.9" Space Gray with Pencil',
    description: 'Lost my Space Gray iPad Air with Apple Pencil magnetically attached. Left in Design Studio B on the workbench.',
    type: 'lost',
    category: 'electronics',
    location: 'Arts & Design Building',
    date: new Date('2026-10-11'),
    time: '18:30',
    color: 'Space Gray',
    brand: 'Apple',
    identifyingDetails: 'Has a matte paper-like screen protector.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    },
  },
  {
    title: 'Casio Vintage Digital Watch',
    description: 'Found a silver stainless steel Casio digital watch on the sink counter of the 1st floor mens restroom in Humanities hall.',
    type: 'found',
    category: 'accessories',
    location: 'Humanities Hall 1st Floor',
    date: new Date('2026-10-10'),
    time: '15:50',
    color: 'Silver',
    brand: 'Casio',
    identifyingDetails: 'Alarm was set for 4:00 PM.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    },
  },
  {
    title: 'Grey University Varsity Hoodie',
    description: 'Lost my oversized heather grey university hoodie after evening basketball intramurals at the gym bleachers.',
    type: 'lost',
    category: 'clothing',
    location: 'Campus Gymnasium Bleachers',
    date: new Date('2026-10-09'),
    time: '20:15',
    color: 'Grey',
    brand: 'Champion',
    identifyingDetails: 'Size XL with embroidered college crest.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
    },
  },
  {
    title: 'TI-84 Plus CE Graphing Calculator',
    description: 'Lost my black TI-84 Plus CE graphing calculator with slip cover. Urgent for upcoming Physics midterm!',
    type: 'lost',
    category: 'electronics',
    location: 'Physics Lab Room 204',
    date: new Date('2026-10-12'),
    time: '14:00',
    color: 'Black',
    brand: 'Texas Instruments',
    identifyingDetails: 'Small silver initials "SK" carved on the slip cover.',
    contactPreference: 'in_app',
    status: 'active',
    image: {
      url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80',
    },
  },
];

const seedItems = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lost2found';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get an existing user to act as the reporter
    let user = await User.findOne({
      $or: [
        { email: 'shyamankumarrajak29@gmail.com' },
        { email: 'demo@lost2found.app' },
        { role: 'student' }
      ]
    });

    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      console.error('No users found in database.');
      process.exit(1);
    }

    console.log(`Attaching items to user: ${user.email} (${user._id})`);

    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');

    // Add reportedBy field to each item
    const itemsToInsert = dummyItems.map((item) => ({
      ...item,
      reportedBy: user._id,
    }));

    // Insert new items
    await Item.insertMany(itemsToInsert);
    console.log(`Successfully seeded ${itemsToInsert.length} items with 100% visible images!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
};

seedItems();
