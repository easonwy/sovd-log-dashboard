import { EventEmitter } from 'events';

// Use a global singleton so Next.js (bundled server) and the custom server
// share the same event bus instance in the same Node.js process.
declare global {
  var __SOVD_EVENT_BUS__: EventEmitter | undefined;
}

const bus: EventEmitter = globalThis.__SOVD_EVENT_BUS__ ?? new EventEmitter();
bus.setMaxListeners(200);
globalThis.__SOVD_EVENT_BUS__ = bus;

export type EventBusEvents = {
  log: (data: unknown) => void;
};

export default bus;