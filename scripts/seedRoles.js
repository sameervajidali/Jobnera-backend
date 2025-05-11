// scripts/seedRoles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../src/models/Role.js';

dotenv.config();
console.log('Seeding roles into:', process.env.MONGO_URI);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Role.deleteMany({});

  const roles = [
    { name: 'USER',       permissions: ['USER_READ'] },
    { name: 'MODERATOR',  permissions: ['USER_READ','USER_UPDATE'] },
    { name: 'CREATOR',    permissions: ['QUIZ_READ','QUIZ_UPDATE','QUIZ_CREATE'] },
    { name: 'SUPPORT',    permissions: ['USER_READ'] },
    { name: 'ADMIN',      permissions: ['ROLE_MANAGE','USER_UPDATE'] },
    { name: 'SUPERADMIN', permissions: ['ROLE_MANAGE','USER_DELETE','USER_UPDATE','QUIZ_READ','QUIZ_UPDATE','QUIZ_CREATE'] },
  ];

  const inserted = await Role.insertMany(roles);
  console.log(`✅ Roles seeded:`, inserted.map(r => r.name).join(', '));
  console.log(`Total roles in DB:`, await Role.countDocuments());

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
