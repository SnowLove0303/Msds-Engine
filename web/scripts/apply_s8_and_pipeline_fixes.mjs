import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/pipeline-engine.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_pipeline-engine.js');

let content = fs.readFileSync(targetPath, 'utf8');

// 1. In buildBaseChineseEngine Section 8, extract srcHandVal and srcRecVal from text record as well
const s8ExtractTarget = `    const srcHandRow = srcS8Rows.find(r => /手部/i.test(r.cells[0]?.text || ''));
    let srcHandVal = '';
    if (srcHandRow && srcHandRow.cells.length > 1) {
      srcHandVal = (srcHandRow.cells[1]?.text || '').trim();
    }`;

const s8ExtractReplacement = `    const srcHandRow = srcS8Rows.find(r => /手部/i.test(r.cells[0]?.text || ''));
    let srcHandVal = '';
    if (srcHandRow && srcHandRow.cells.length > 1) {
      srcHandVal = (srcHandRow.cells[1]?.text || '').trim();
    }
    if (srcS8 && srcS8.text) {
      const lines = srcS8.text.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (/手部/i.test(line)) {
          const m = line.match(/手部[^：:\\s]*[：:]\\s*(.*)$/);
          if (m) srcHandVal = m[1].trim();
        }
        if (/建议/i.test(line)) {
          const m = line.match(/建议[^：:\\s]*[：:]\\s*(.*)$/);
          if (m) srcRecVal = m[1].trim();
        }
      }
    }`;

content = content.replace(s8ExtractTarget, s8ExtractReplacement);

// 2. Add benchmark supplementation for Section 8 glove rows
const s8BenchmarkTarget = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));`;

const s8BenchmarkReplacement = `    // 结合同品类基准库补充手部防护手套技术参数（消灭 6 行空值栏）
    const benchmark = getBenchmarkSpecsByCategory(modelCode);
    if (benchmark?.ppeHandSpecs) {
      for (const row of s8.rows) {
        const lbl = (row.cells[0]?.text || '').trim();
        const valCell = row.cells.length > 1 ? row.cells[row.cells.length - 1] : null;
        if (!valCell) continue;
        const curVal = (valCell.text || '').trim();
        if (!curVal) {
          if (/氟化橡胶|FKM/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.fkm);
          else if (/丁基橡胶|IIR/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.iir);
          else if (/丁腈橡胶|NBR/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.nbr);
          else if (/建议/i.test(lbl)) safeWriteCellValue(valCell, srcRecVal || benchmark.ppeHandSpecs.recommendation);
        }
      }
    }

    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));`;

content = content.replace(s8BenchmarkTarget, s8BenchmarkReplacement);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Fixed pipeline-engine.js proposed.');
