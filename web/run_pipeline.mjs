import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import path from 'node:path';
import fs from 'node:fs/promises';
import { executeEightDeliverablesPipeline } from './src/pipeline-engine.js';

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const modelCode = getArg('--model');
const inputPath = getArg('--input');
const outDir = getArg('--outDir') || path.dirname(inputPath);

if (!modelCode || !inputPath) {
  console.error('Usage: node run_pipeline.mjs --model <MODEL> --input <INPUT_PATH> [--outDir <OUT_DIR>]');
  process.exit(1);
}

console.log(`Starting 8-deliverables pipeline for model: ${modelCode}`);
console.log(`Input source: ${inputPath}`);
console.log(`Target directory: ${outDir}`);

async function run() {
  const result = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: inputPath,
    targetDir: outDir,
    facts: {}
  });

  console.log(`\n=== Pipeline Completed for ${modelCode} in ${result.durationMs}ms ===`);
  console.log('Preserved source files:', result.preservedSourceFiles);
  console.log('Generated deliverables:');
  for (const [k, v] of Object.entries(result.deliverables)) {
    console.log(`  - [${k}]: ${v}`);
  }
}

run().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
