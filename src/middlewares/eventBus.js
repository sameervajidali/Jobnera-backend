import bus from '../events/notificationBus.js';

/**
 * Middleware to inject event bus instance into the request object.
 * This allows route handlers and other middleware to emit or listen
 * to events via req.bus.
 */
export default function eventBus(req, _res, next) {
  req.bus = bus;
  next();
}
