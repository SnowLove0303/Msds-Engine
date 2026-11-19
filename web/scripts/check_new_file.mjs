import fs from 'node:fs';

const content = fs.readFileSync('web/src/msds-db.js.new', 'utf8');
console.log('msds-db.js.new length:', content.length, 'has getBenchmarkSpecsByCategory:', content.includes('getBenchmarkSpecsByCategory'));
