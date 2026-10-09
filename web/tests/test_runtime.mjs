import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://127.0.0.1:5173/',
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.localStorage = dom.window.localStorage;
globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);

try {
  await import('../src/main.js');
  console.log('App loaded without runtime error!');
  const app = dom.window.document.getElementById('app');
  console.log('App innerHTML length:', app.innerHTML.length);
} catch (e) {
  console.error('RUNTIME_ERROR_IN_MAIN:', e);
}
