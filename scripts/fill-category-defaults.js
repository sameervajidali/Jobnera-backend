// migrations/fill-category-defaults.js
import mongoose from 'mongoose'
import Category from '../src/models/Category.js';


await mongoose.connect('mongodb+srv://techwithvajid:qRfWHoFdOFFyWmYe@cluster0.hxfrzs2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

await Category.updateMany(
  { type: { $exists: false } },
  { 
    $set: {
      type: 'all',
      icon: '',
      isVisible: true,
      order: 0
    }
  }
);

console.log('✅ Backfilled category defaults');
process.exit();
