import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function testImport() {
  try {
    const mod = await import('./src/pipeline-engine-proposed.mjs');
    console.log('Successfully imported pipeline-engine-proposed.mjs!');
    console.log('Exports count:', Object.keys(mod).length);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}


testImport();
