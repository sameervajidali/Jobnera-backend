// src/services/changeStreamListeners.js
import mongoose from 'mongoose';
import bus from '../events/notificationBus.js';

// helper to watch a model for change events
function watchModel(Model, onChange) {
  const stream = Model.watch([], { fullDocument: 'updateLookup' });
  stream.on('change', change => {
    try { onChange(change); }
    catch (err) { console.error(`ChangeStream handler error for ${Model.modelName}:`, err); }
  });
  stream.on('error', err => {
    console.error(`ChangeStream error on ${Model.modelName}:`, err);
  });
}

// import your Mongoose models (no User model watchers here)
import QuizAssignment    from '../models/QuizAssignment.js';
import QuizAttempt       from '../models/QuizAttempt.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import Application       from '../models/Application.js';
import Ticket            from '../models/Ticket.js';
import Job               from '../models/Job.js';
import Material          from '../models/Material.js';

export default function setupChangeStreams() {
  console.log('🔔 Initializing change streams for domain events');

  // ── Quiz Assigned ──────────────────────────────────────────────
  watchModel(QuizAssignment, ({ operationType, fullDocument }) => {
    if (operationType === 'insert') {
      bus.emit('quizAssigned', {
        userId: fullDocument.userId,
        quizId: fullDocument.quizId,
        title:  'New Quiz Assigned'
      });
    }
  });

  // ── Quiz Graded ────────────────────────────────────────────────
  watchModel(QuizAttempt, ({ operationType, fullDocument }) => {
    if ((operationType === 'insert' || operationType === 'update') && fullDocument.score != null) {
      bus.emit('quizGraded', {
        userId: fullDocument.userId,
        quizId: fullDocument.quizId,
        score:  fullDocument.score
      });
    }
  });

  // ── Password Reset Requested ───────────────────────────────────
  watchModel(PasswordResetToken, ({ operationType, fullDocument }) => {
    if (operationType === 'insert') {
      bus.emit('passwordResetRequested', { userId: fullDocument.userId });
    }
  });

  // ── Application Status Changed ─────────────────────────────────
  watchModel(Application, ({ operationType, fullDocument, updateDescription, documentKey }) => {
    if (operationType === 'update' && updateDescription.updatedFields.status) {
      bus.emit('applicationStatusChanged', {
        userId:        fullDocument.userId,
        applicationId: documentKey._id,
        status:        updateDescription.updatedFields.status
      });
    }
  });

  // ── Ticket Replied ─────────────────────────────────────────────
  watchModel(Ticket, ({ operationType, fullDocument, updateDescription, documentKey }) => {
    if (operationType === 'update' && updateDescription.updatedFields.latestReply) {
      bus.emit('ticketReplied', {
        userId:   fullDocument.user.toString(),
        ticketId: documentKey._id,
        message:  updateDescription.updatedFields.latestReply.text
      });
    }
  });

  // ── Job Posted ─────────────────────────────────────────────────
  watchModel(Job, ({ operationType, fullDocument }) => {
    if (operationType === 'insert') {
      const { _id: jobId, title } = fullDocument;
      // notify all users or targeted group
      mongoose.model('User').find().select('_id').lean()
        .then(users => {
          users.forEach(u =>
            bus.emit('jobPosted', { userId: u._id, jobId, title })
          );
        })
        .catch(console.error);
    }
  });

  // ── Material Assigned ──────────────────────────────────────────
  watchModel(Material, ({ operationType, fullDocument }) => {
    if (operationType === 'insert') {
      bus.emit('materialAssigned', {
        userId:     fullDocument.userId,
        materialId: fullDocument._id,
        title:      fullDocument.title || 'New Material Available'
      });
    }
  });

  console.log('✅ Change streams are active.');
}
