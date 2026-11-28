import fs from 'fs/promises';
import JSZip from 'jszip';

async function parseTranslationDocx() {
  const transDocxPath = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608\\对照翻译.docx';
  const buf = await fs.readFile(transDocxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const paragraphs = [];
  const pRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const pXml = match[1];
    const text = pXml.replace(/<[^>]+>/g, '').trim();
    if (text) {
      paragraphs.push(text);
    }
  }

  // Parse into sections 1 to 16
  const sections = {};
  let currentSec = null;
  for (const p of paragraphs) {
    const secMatch = p.match(/^###\s*(\d+)\.\s*(.*)/);
    if (secMatch) {
      currentSec = parseInt(secMatch[1], 10);
      sections[currentSec] = { title: secMatch[2], lines: [] };
      continue;
    }
    if (currentSec !== null) {
      if (p === '---') continue;
      sections[currentSec].lines.push(p);
    }
  }

  console.log('Parsed sections:');
  for (const [s, data] of Object.entries(sections)) {
    console.log(`\nSection ${s}: ${data.title} (${data.lines.length} lines)`);
    data.lines.slice(0, 5).forEach(l => console.log('  ', l));
  }
}

parseTranslationDocx().catch(console.error);
