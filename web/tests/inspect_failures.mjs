import fs from 'fs';
const txt = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/.system_generated/steps/41183/output.txt', 'utf8');
const lines = txt.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('FAIL') || line.includes('❌') || line.includes('违章')) {
    console.log(`[Line ${i}] ${line}`);
    // print 2 lines after
    for (let j = 1; j <= 3; j++) {
      if (lines[i + j]) console.log(`   + ${lines[i + j]}`);
    }
  }
}
