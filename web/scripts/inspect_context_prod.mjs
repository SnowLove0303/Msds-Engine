import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';

const sampleSource = path.resolve('算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx');
const context1 = await recognizeSourceDocx(sampleSource, path.basename(sampleSource));
const governed = governContext(context1);
console.log('context1.modelCode:', context1.modelCode);
console.log('context1.productName:', context1.productName);
console.log('governed.cn.productName:', governed.cn.productName);
console.log('governed.cn.modelCode:', governed.cn.modelCode);
