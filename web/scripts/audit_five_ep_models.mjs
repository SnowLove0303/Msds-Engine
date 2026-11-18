import path from 'node:path';
import { runMasterMsdsAudit } from './run_master_msds_audit.mjs';

const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP';
const sourceBase = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP';
const models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737'];

async function runAll() {
  const summary = [];
  for (const model of models) {
    const targetDir = path.join(baseDir, model);
    const sourceDocx = path.join(sourceBase, model, `${model} msds_CN 冠志_源文件留存.docx`);
    console.log(`\n========================================================================================`);
    console.log(`>>> START AUDIT: ${model}`);
    console.log(`========================================================================================`);
    try {
      const res = await runMasterMsdsAudit({
        model,
        targetDir,
        sourceDocx
      });
      summary.push({ model, ...res });
    } catch (e) {
      console.error(`ERROR running audit on ${model}:`, e);
      summary.push({ model, error: e.message });
    }
  }

  console.log('\n========================================================================================');
  console.log('>>> ALL 5 MODELS AUDIT SUMMARY:');
  console.log('========================================================================================');
  for (const s of summary) {
    if (s.error) {
      console.log(`${s.model}: ERROR - ${s.error}`);
    } else {
      console.log(`${s.model}: Total=${s.totalAssertions}, Pass=${s.passCount + s.whitelistPassCount}, Fail=${s.failCount}, Success=${s.success}`);
      if (s.failureDetails && s.failureDetails.length > 0) {
        console.log(`  Failures for ${s.model}:`);
        s.failureDetails.forEach((f, idx) => {
          console.log(`    ${idx + 1}. [${f.ringId}] [${f.dimension}] ${f.contract}: ${f.actualObserved}`);
        });
      }
    }
  }
}

runAll();
