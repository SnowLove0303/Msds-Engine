import fs from 'node:fs';

const orig = fs.readFileSync('web/src/msds-db.js', 'utf8');
const prop = fs.readFileSync('web/data/proposed_msds-db.js', 'utf8');

console.log('Orig length:', orig.length, 'has getBenchmarkSpecsByCategory:', orig.includes('getBenchmarkSpecsByCategory'));
console.log('Prop length:', prop.length, 'has getBenchmarkSpecsByCategory:', prop.includes('getBenchmarkSpecsByCategory'));
