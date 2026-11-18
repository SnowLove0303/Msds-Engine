import fs from 'fs';

// Check context-governor.js
const cgPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js';
let cg = fs.readFileSync(cgPath, 'utf8');

const oldDict = `'二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',`;
const newDict = `'二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N-甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N-甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',`;

console.log('cg has oldDict?', cg.includes(oldDict));

// Check pipeline-engine.js typo
const pePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let pe = fs.readFileSync(pePath, 'utf8');
console.log('pe has typo?', pe.includes('red血球异常减少'));
