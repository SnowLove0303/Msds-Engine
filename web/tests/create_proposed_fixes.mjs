import fs from 'fs';

// 1. context-governor.js
const cgPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js';
let cg = fs.readFileSync(cgPath, 'utf8').replace(/\r\n/g, '\n');

const oldDict = `  '二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',`;
const newDict = `  '二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N-甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N-甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',`;

cg = cg.replace(oldDict, newDict);

const oldFuzzy = `  if (/水$/i.test(trimmed)) return 'Water';`;
const newFuzzy = `  if (/二甲基乙酰胺/i.test(trimmed)) return 'N,N-Dimethylacetamide (DMAC)';
  if (/甲基吡咯烷酮/i.test(trimmed)) return 'N-Methyl-2-pyrrolidone (NMP)';
  if (/乙基吡咯烷酮/i.test(trimmed)) return '1-Ethylpyrrolidin-2-one (NEP)';
  if (/水$/i.test(trimmed)) return 'Water';`;

cg = cg.replace(oldFuzzy, newFuzzy);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_context_governor.js', cg, 'utf8');
console.log('proposed_context_governor.js created!');

// 2. pipeline-engine.js typo fix
const pePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let pe = fs.readFileSync(pePath, 'utf8').replace(/\r\n/g, '\n');

pe = pe.replace(/red血球异常减少/g, 'red blood cells');

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', pe, 'utf8');
console.log('proposed_pipeline_engine.js created!');
