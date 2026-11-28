import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';
import path from 'path';

const srcPath = path.resolve('web/scratch/pa_doc_converted/PA-3612 msds_CN 冠志.docx');
console.log('Testing recognition on:', srcPath);
const context1 = await recognizeSourceDocx(srcPath, path.basename(srcPath));

console.log('Recognized Sections:', Object.keys(context1.sections || {}).length);
console.log('Components:', context1.components);
console.log('GHS:', context1.ghs);
console.log('Physical Properties count:', (context1.physicalProperties || []).length);
console.log('Disposal:', context1.disposal);
console.log('Transport:', context1.transport);
