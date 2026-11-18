import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const tplDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/dist/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx';
const testDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/test_tpl_pdf';
fs.mkdirSync(testDir, { recursive: true });

const copiedDocx = path.join(testDir, 'template.docx');
fs.copyFileSync(tplDocx, copiedDocx);

console.log('Converting template docx to pdf...');
execSync(`soffice --headless --convert-to pdf "${copiedDocx}" --outdir "${testDir}"`, { stdio: 'inherit' });

const pyScript = `
import pymupdf
import sys

doc = pymupdf.open(sys.argv[1])
p0 = doc[0]
rect = p0.rect
words = p0.get_text('words')
for w in words:
    if w[1] > rect.height - 150:
        print(f"Word: {w[4]:<35} Box: ({w[0]:.1f}, {w[1]:.1f}, {w[2]:.1f}, {w[3]:.1f})")
`;
fs.writeFileSync(path.join(testDir, 'extract.py'), pyScript, 'utf8');
const tplPdf = path.join(testDir, 'template.pdf');
console.log('Running python extractor on template.pdf:');
execSync(`python "${path.join(testDir, 'extract.py')}" "${tplPdf}"`, { stdio: 'inherit' });
