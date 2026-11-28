import fs from 'fs';

if (fs.existsSync('src/translation-map.json')) {
  const map = JSON.parse(fs.readFileSync('src/translation-map.json', 'utf8'));
  console.log('translation-map keys count:', Object.keys(map).length);
  const sampleKeys = Object.keys(map).slice(0, 30);
  console.log('Sample keys:', sampleKeys);
  const hKeys = Object.keys(map).filter(k => k.startsWith('H') || k.startsWith('P'));
  console.log('H/P keys count:', hKeys.length);
  console.log('Sample H/P:', hKeys.slice(0, 10));
} else {
  console.log('src/translation-map.json does not exist');
}
