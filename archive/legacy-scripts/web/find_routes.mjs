import fs from 'fs';

const content = fs.readFileSync('src/msds-api-controller.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('executeEightDeliverablesPipeline') || l.includes('/api/msds/export') || l.includes('/api/msds/batch') || l.includes('/api/msds/pipeline')) {
    console.log(`${i+1}: ${l.trim().slice(0, 90)}`);
  }
});
