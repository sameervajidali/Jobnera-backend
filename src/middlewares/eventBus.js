// src/middlewares/eventBus.js
import bus from '../events/notificationBus.js';
export default function eventBus(req, _res, next) {
  req.bus = bus;
  next();
}
