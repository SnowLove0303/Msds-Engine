import fs from 'node:fs';

const orig = fs.readFileSync('web/src/smart-matching.js', 'utf8');
const prop = fs.readFileSync('web/data/proposed_smart-matching.js', 'utf8');

console.log('Smart matching orig length:', orig.length, 'has harmonizeWithBenchmarkDatabase:', orig.includes('harmonizeWithBenchmarkDatabase'));
console.log('Smart matching prop length:', prop.length, 'has harmonizeWithBenchmarkDatabase:', prop.includes('harmonizeWithBenchmarkDatabase'));
