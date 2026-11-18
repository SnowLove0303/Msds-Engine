import fs from 'node:fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();

const targetDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A/BL-8129A msds_CN 冠志.docx';
const buf = fs.readFileSync(targetDocx);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = parser.parseFromString(xml, 'application/xml');

const tbls = doc.getElementsByTagName('w:tbl');
const s4 = tbls[3];
const r1 = s4.getElementsByTagName('w:tr')[1];
const c0 = r1.getElementsByTagName('w:tc')[0];
console.log('c0 XML:\n', new dom.window.XMLSerializer().serializeToString(c0));
