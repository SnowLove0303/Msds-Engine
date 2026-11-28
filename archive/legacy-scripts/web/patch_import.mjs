import fs from 'fs';
let content = fs.readFileSync('./web/src/pipeline-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetImport = `import {
  loadDocx,
  applyStandardHangingIndent,
  writeCellValue,
  writeCellLabel,
  updateHeaderFooterData,
  extractAdaptiveRevisionDate,
  addRowAfter,
  deleteRow,
  renumberRecord
} from './docx-engine.js';`;

const newImport = `import {
  loadDocx,
  applyStandardHangingIndent,
  writeCellValue,
  writeCellLabel,
  updateHeaderFooterData,
  extractAdaptiveRevisionDate,
  addRowAfter,
  deleteRow,
  renumberRecord,
  removeCellFromRow
} from './docx-engine.js';`;

if (!content.includes(targetImport)) {
  console.log('targetImport not found!');
  process.exit(1);
}

content = content.replace(targetImport, newImport);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('./scratch/pipeline-engine.proposed2.js', content, 'utf8');
console.log('Successfully created ./scratch/pipeline-engine.proposed2.js');
