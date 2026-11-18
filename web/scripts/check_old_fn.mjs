import fs from 'node:fs/promises';

async function checkOld() {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
  const m = content.match(/export function translatePersistenceValueToEnglish[\s\S]*?\n\}/);
  if (m) {
    console.log('Found:\n', JSON.stringify(m[0]));
  } else {
    console.log('NOT FOUND');
  }
}
checkOld().catch(console.error);
