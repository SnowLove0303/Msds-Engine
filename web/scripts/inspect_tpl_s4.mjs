import fs from 'node:fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/templates/正式模板_MSDS_CN_冠志(1).docx';
const buf = fs.readFileSync(tplPath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = parser.parseFromString(xml, 'application/xml');

const tbls = doc.getElementsByTagName('w:tbl');
const s4 = tbls[3]; // Section 4
console.log('Template S4 rows:', s4.getElementsByTagName('w:tr').length);
const r1 = s4.getElementsByTagName('w:tr')[1];
const c0 = r1.getElementsByTagName('w:tc')[0];
console.log('Template S4 r1 c0 XML:\n', new dom.window.XMLSerializer().serializeToString(c0));
