import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
  let content = await fs.readFile(filePath, 'utf8');

  // Replace English t1 double space with t1 + tab
  const oldEn = `    const t1 = p.ownerDocument.createElementNS(W_NS, 'w:t');
    t1.setAttribute('xml:space', 'preserve');
    t1.textContent = numberStr + '  ';
    r1.appendChild(t1);
    p.appendChild(r1);`;

  const newEn = `    const t1 = p.ownerDocument.createElementNS(W_NS, 'w:t');
    t1.textContent = numberStr;
    r1.appendChild(t1);

    const tab = p.ownerDocument.createElementNS(W_NS, 'w:tab');
    r1.appendChild(tab);
    p.appendChild(r1);`;

  // Replace Chinese sz1 from 24 to 21
  const oldCn = `  const sz1 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', '24');
  rPr1.appendChild(sz1);
  const szCs1 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs1.setAttributeNS(W_NS, 'w:val', '24');
  rPr1.appendChild(szCs1);`;

  const newCn = `  const sz1 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', '21');
  rPr1.appendChild(sz1);
  const szCs1 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs1.setAttributeNS(W_NS, 'w:val', '21');
  rPr1.appendChild(szCs1);`;

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOldEn = oldEn.replace(/\r\n/g, '\n');
  const normalizedNewEn = newEn.replace(/\r\n/g, '\n');
  const normalizedOldCn = oldCn.replace(/\r\n/g, '\n');
  const normalizedNewCn = newCn.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOldEn)) {
    console.error('Old EN block not found in docx-engine.js!');
    process.exit(1);
  }
  if (!normalizedContent.includes(normalizedOldCn)) {
    console.error('Old CN block not found in docx-engine.js!');
    process.exit(1);
  }

  let updated = normalizedContent.replace(normalizedOldEn, normalizedNewEn);
  updated = updated.replace(normalizedOldCn, normalizedNewCn);

  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/docx-engine-proposed.js', updated);
  console.log('Successfully generated docx-engine-proposed.js');
}
main();
