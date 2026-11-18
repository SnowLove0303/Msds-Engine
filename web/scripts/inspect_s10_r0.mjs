import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const zipData = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(zipData);
const docXmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
const s10Tbl = tbls[9];
const r1 = Array.from(s10Tbl.getElementsByTagName('w:tr'))[1];
const c0 = Array.from(r1.getElementsByTagName('w:tc'))[0];
const p = c0.getElementsByTagName('w:p')[0];
const r0 = Array.from(p.getElementsByTagName('w:r'))[0];
console.log('r0 xml:', r0.toString());
