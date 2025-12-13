import { Buffer } from 'buffer';

globalThis.process = globalThis.process || { env: {} }; // Minimal process polyfill
globalThis.global = globalThis.global || globalThis;
globalThis.Buffer = globalThis.Buffer || Buffer;

declare global {
  interface WindowEventMap {
    'blackbottle:log': CustomEvent;
    'blackbottle:track': CustomEvent;
    'blackbottle:identify': CustomEvent;
  }

  var Intercom: any;
}
