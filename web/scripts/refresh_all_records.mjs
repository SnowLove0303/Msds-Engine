import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';
import { getDb, getDocxBuffer, updateRecordMatch } from '../src/msds-db.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

const APP_VERSION = '1.4.0';

async function main() {
  console.log(`=== 开始全库历史记录升级至 v${APP_VERSION} 算法 ===\n`);
  const db = getDb();
  const records = db.prepare('SELECT id, model, file_name, engine_version, raw_facts_json FROM msds_records').all();
  console.log(`查找到全库记录数: ${records.length}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      let inspectorRecords = null;
      const buffer = getDocxBuffer(r.id);
      if (buffer) {
        const doc = await loadDocx(buffer, r.file_name);
        inspectorRecords = doc.records;
      }
      if (!inspectorRecords && r.raw_facts_json) {
        const raw = JSON.parse(r.raw_facts_json);
        inspectorRecords = Array.isArray(raw) ? raw : (raw.records || []);
      }
      if (!inspectorRecords || inspectorRecords.length === 0) {
        console.warn(`[${i + 1}/${records.length}] 跳过 (无可用数据): ${r.id} (${r.model})`);
        failCount++;
        continue;
      }

      const newMatchRes = runSmartMatching(inspectorRecords);
      const updateRes = updateRecordMatch(r.id, newMatchRes, APP_VERSION);
      successCount++;
      console.log(`[${i + 1}/${records.length}] 升级成功: ${r.model || r.file_name} -> matched: ${updateRes.matched}, status: ${updateRes.status}`);
    } catch (err) {
      console.error(`[${i + 1}/${records.length}] 升级失败: ${r.id} (${r.model}): ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n=== 迁移完成: 成功 ${successCount} 条, 失败 ${failCount} 条 ===`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
