import fs from 'node:fs';

const lines = fs.readFileSync('scratch/review_bundle_extracted/annotations.ndjson', 'utf8').trim().split('\n');
console.log('Total annotations:', lines.length);

lines.forEach((l, idx) => {
  const a = JSON.parse(l);
  console.log(`\n================== [Annotation #${idx + 1}] ==================`);
  console.log(`ID: ${a.annotationId || a.id} | Severity: ${a.severity} | Sec: ${a.sectionNumber || a.anchor?.sectionNumber}`);
  console.log(`Title: ${a.title}`);
  console.log(`Category: ${a.category}`);
  console.log(`Comment: ${a.comment}`);
  console.log(`Expected: ${JSON.stringify(a.expected)}`);
  console.log(`Actual:   ${JSON.stringify(a.actual)}`);
});
