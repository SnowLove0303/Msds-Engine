import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { GHS_CATEGORY_TRANS_MAP, GHS_P_TRANS_MAP } from '../src/pipeline-engine.js';

console.log('Testing GHS mappings...');
