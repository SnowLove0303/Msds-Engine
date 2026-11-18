import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';
const buf = fs.readFileSync(srcPath);
const zip = await JSZip.loadAsync(buf);
const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('word/media/'));
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const s2Tbl = doc.getElementsByTagName('w:tbl')[1];
const blips = Array.from(s2Tbl.getElementsByTagName('a:blip'));
const embeds = blips.map(b => b.getAttribute('r:embed'));
console.log(`Source Media files: ${mediaFiles.length} (${mediaFiles.join(', ')}), Section 2 drawing embeds: ${embeds.length} (${embeds.join(', ')})`);
