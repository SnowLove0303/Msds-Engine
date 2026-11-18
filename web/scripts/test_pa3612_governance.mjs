import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';
import path from 'path';

const srcPath = path.resolve('web/scratch/pa_doc_converted/PA-3612 msds_CN 冠志.docx');
const context1 = await recognizeSourceDocx(srcPath, path.basename(srcPath));
context1.modelCode = 'PA-3612';
context1.productName = 'PA-3612 单组份水性丙烯酸乳液';

const governed = governContext(context1);

console.log('Governed CN components:', governed.cn.components);
console.log('Governed EN components:', governed.en.components);
console.log('Governed CN GHS:', governed.cn.ghs);
console.log('Governed EN GHS:', governed.en.ghs);
console.log('Governed CN Transport:', governed.cn.transport);
console.log('Governed EN Transport:', governed.en.transport);
console.log('Physical Properties count:', governed.cn.physicalProperties.length);
