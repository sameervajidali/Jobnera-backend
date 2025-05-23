// src/services/notificationService.js
import Notification from '../models/Notification.js';
import Role         from '../models/Role.js';
import User         from '../models/User.js';
import { getIO, getOnlineUsers } from './notificationSockets.js';

export async function sendNotification(userId, type, payload) {
  try {
    console.log('🔔 sendNotification()', { userId, type, payload });
    // 1) Create for the intended user
    const notif = await Notification.create({ user: userId, type, payload });
    console.log('✅ Notification saved:', notif._id);
    pushToSocket(userId, notif);

    // 2) Find all Admin & Superadmin users
    const adminRoles = await Role.find({ name: { $in: ['ADMIN','SUPERADMIN'] } }).select('_id');
    const adminUsers = await User.find({ role: { $in: adminRoles.map(r => r._id) } }).select('_id');

    // 3) Broadcast a copy to each admin
    await Promise.all(
      adminUsers.map(async ({ _id: adminId }) => {
        const copy = await Notification.create({
          user:    adminId,
          type,
          payload: {
            ...payload,
            _broadcast: true,          // optional flag so you can style it differently
            originalFor: userId.toString()
          }
        });
        console.log('📋 Admin copy saved:', copy._id, 'for admin', adminId);
        pushToSocket(adminId, copy);
      })
    );

    return notif;
  } catch (err) {
    console.error('❌ sendNotification error:', err);
    throw err;
  }
}

// helper to emit over sockets
function pushToSocket(userId, notif) {
  const io      = getIO();
  const online  = getOnlineUsers().get(userId.toString());
  if (io && online) {
    online.forEach((sockId) => io.to(sockId).emit('notification:new', notif));
    console.log('📣 Emitted', notif._id, 'to sockets', [...online]);
  }
}
