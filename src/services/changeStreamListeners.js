// src/services/changeStreamListeners.js
import mongoose from 'mongoose';
import QuizAssignment from '../models/QuizAssignment.js';

import bus from '../events/notificationBus.js';

export default function setupChangeStreams() {
  // Watch the assignments collection
  QuizAssignment.watch().on('change', change => {
    if (change.operationType === 'insert') {
      const { userId, quizId } = change.fullDocument;
      bus.emit('quizAssigned', { userId, quizId, title: 'New Quiz Assigned' });
    }
  });

//   // Watch the password reset tokens
//   PasswordResetToken.watch().on('change', change => {
//     if (change.operationType === 'insert') {
//       const { userId } = change.fullDocument;
//       bus.emit('passwordResetRequested', { userId });
//     }
//   });

  // …and so on for other collections/events…
}
