import fs from 'node:fs/promises';

async function restore() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/pipeline-engine.proposed_geo.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  content = content.replace(
    '  renumberRecord,\n  removeCellFromRow\n} from',
    '  renumberRecord,\n  removeCellFromRow,\n  normalizeRowGeometry\n} from'
  );

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/pipeline-engine.restored_full.js', content, 'utf8');
  console.log('Restored full pipeline-engine to scratch/pipeline-engine.restored_full.js');
}
restore();
