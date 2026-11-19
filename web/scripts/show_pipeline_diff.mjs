import { execSync } from 'node:child_process';

const diff = execSync('git diff web/src/pipeline-engine.js', { encoding: 'utf8' });
console.log(diff.slice(0, 1500));
