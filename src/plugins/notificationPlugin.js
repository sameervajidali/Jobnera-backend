// src/plugins/notificationPlugin.js
import bus from '../events/notificationBus.js';

/**
 * A Mongoose plugin to emit domain events on create/update
 * options.events: array of { on, event, match?, payload }
 *  - on: 'insert' | 'update'
 *  - event: string (bus event name)
 *  - match: optional fn(doc, update) => boolean
 *  - payload: fn(doc, update) => Object
 */
export default function notificationPlugin(schema, options) {
  const events = Array.isArray(options.events) ? options.events : [];

  // After save => creation
  schema.post('save', function(doc, next) {
    if (this.isNew) {
      events.forEach(e => {
        if (e.on === 'insert') {
          if (!e.match || e.match(doc)) {
            bus.emit(e.event, e.payload(doc));
          }
        }
      });
    }
    next();
  });

  // After findOneAndUpdate => updates
  schema.post('findOneAndUpdate', function(doc, next) {
    const update = this.getUpdate() || {};
    events.forEach(e => {
      if (e.on === 'update') {
        if (!e.match || e.match(doc, update)) {
          bus.emit(e.event, e.payload(doc, update));
        }
      }
    });
    next();
  });
}
