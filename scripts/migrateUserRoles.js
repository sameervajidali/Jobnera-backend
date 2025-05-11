import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  // build a map from role name → _id
  const roles = await Role.find();
  const map = Object.fromEntries(roles.map(r => [r.name, r._id]));

  const users = await User.find().lean();
  for (const u of users) {
    const oldRoleString = u.roleString || u.role; // whatever field you used before
    const newRoleId = map[oldRoleString];
    if (!newRoleId) {
      console.warn(`No role found for "${oldRoleString}" on user ${u._id}`);
      continue;
    }
    await User.updateOne({ _id: u._id }, { role: newRoleId });
  }

  console.log('✅ User roles migrated');
  mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
