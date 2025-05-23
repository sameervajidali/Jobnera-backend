// src/events/notificationBus.js
import { EventEmitter } from 'events';
import { sendNotification } from '../services/notificationService.js';

// Central event bus for triggering notifications
const bus = new EventEmitter();

// ── User Events ──────────────────────────────────────────────────────────────
// Welcome new users on registration
bus.on('userRegistered', async ({ userId }) => {
  await sendNotification(userId, 'userRegistered', { message: 'Welcome to JobNeura!' });
});

// Password reset requested
bus.on('passwordResetRequested', async ({ userId }) => {
  await sendNotification(userId, 'passwordResetRequested', { message: 'Password reset requested.' });
});

// Password reset completed
bus.on('passwordResetCompleted', async ({ userId }) => {
  await sendNotification(userId, 'passwordResetCompleted', { message: 'Your password has been successfully changed.' });
});

// ── Quiz Events ──────────────────────────────────────────────────────────────
// A new quiz has been assigned to a user
bus.on('quizAssigned', async ({ userId, quizId, title }) => {
  await sendNotification(userId, 'quizAssigned', { quizId, title });
});

// A quiz attempt has been graded
bus.on('quizGraded', async ({ userId, quizId, score }) => {
  await sendNotification(userId, 'quizGraded', { quizId, score });
});

// ── Material Events ──────────────────────────────────────────────────────────
// New learning material assigned
bus.on('materialAssigned', async ({ userId, materialId, title }) => {
  await sendNotification(userId, 'materialAssigned', { materialId, title });
});

// ── Ticket Events ────────────────────────────────────────────────────────────
// Support ticket received a reply
bus.on('ticketReplied', async ({ userId, ticketId, message }) => {
  await sendNotification(userId, 'ticketReplied', { ticketId, message });
});

// ── Job Events ───────────────────────────────────────────────────────────────
// New job posted matching a user's profile
bus.on('jobPosted', async ({ userId, jobId, title }) => {
  await sendNotification(userId, 'jobPosted', { jobId, title });
});

// Application status updated
bus.on('applicationStatusChanged', async ({ userId, applicationId, status }) => {
  await sendNotification(userId, 'applicationStatusChanged', { applicationId, status });
});

// ── Admin/User Management Events ─────────────────────────────────────────────
// New user created by admin
bus.on('adminUserCreated', async ({ userId }) => {
  await sendNotification(userId, 'adminUserCreated', { message: 'Your account was created by an admin.' });
});

// Role changed for a user
bus.on('roleChanged', async ({ userId, oldRole, newRole }) => {
  await sendNotification(userId, 'roleChanged', { oldRole, newRole });
});

// Export the bus for controllers to emit events
export default bus;
