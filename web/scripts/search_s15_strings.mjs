import fs from 'fs';

function searchInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('Other provisions') || l.includes('Complies with the following') || l.includes(': .')) {
      console.log(`${filePath}:${i+1}: ${l}`);
    }
  });
}

searchInFile('web/src/pipeline-engine.js');
searchInFile('web/src/smart-matching.js');
searchInFile('web/src/universal-standardizer.js');
searchInFile('web/src/bilingual-auditor.js');
