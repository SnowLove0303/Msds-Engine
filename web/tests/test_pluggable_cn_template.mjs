import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTopologyPluginSlot } from '../src/topology-plugin-slot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CN_TPL_PATH = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');

const slot = createTopologyPluginSlot();

// 1. 初始状态：绝对未载入用户模板
assert.equal(slot.isMounted(), false);
assert.throws(() => slot.getMountedProfile(), /TOPOLOGY_SLOT_UNMOUNTED/);
console.log('✅ PASS: 初始状态未载入任何用户数据');

// 2. 插拔式载入仓库 CN 模板并动态构建 StandardTopology
const status = await slot.mountTemplate(CN_TPL_PATH);
assert.equal(status.mounted, true);
assert.ok(status.sourceSha256);

// 3. 多次复用同一构建结果（无需重复解析 DOCX）
const profile1 = slot.getMountedProfile();
const profile2 = slot.getMountedProfile();
const topo1 = slot.getMountedTopology();
assert.strictEqual(profile1, profile2, '多次复用应返回同一冻结构建结果');
assert.equal(slot.getStatus().reuseCount, 3);

console.log('\n=== 仓库 CN 模板动态识别与构建结果实测摘要 ===');
console.log(JSON.stringify({
  templateKey: profile1.templateKey,
  schemaVersion: profile1.schemaVersion,
  sectionsCount: profile1.sectionsCount,
  docDefaults: profile1.docDefaults,
  pageSizePt: profile1.pageFormat?.pageSize,
  typographyProfile: {
    fontFamily: profile1.typographyProfile?.fontFamily,
    asciiFontFamily: profile1.typographyProfile?.asciiFontFamily,
    valueFontSize: profile1.typographyProfile?.valueFontSize,
    headerFontSize: profile1.typographyProfile?.headerFontSize,
    tiers: profile1.typographyProfile?.tiers
  },
  stylePrototypeRoles: Object.keys(profile1.stylePrototypes || {}),
  footerContainer: profile1.headerFooterTopology?.containerType,
  footerSlotsCount: profile1.headerFooterTopology?.slots?.length || 0,
  sectionsSummary: profile1.sections.map(s => ({
    sec: s.sectionNumber,
    layout: s.layoutType,
    rows: s.rowsCount,
    cols: s.columnWidths.length,
    kvCloneRow: s.rowTemplates?.kvCloneRowIndex,
    dataCloneRow: s.rowTemplates?.dataCloneRowIndex
  })),
  totalSlots: topo1.sections.reduce((acc, s) => acc + (s.slots?.length || 0), 0)
}, null, 2));

// 4. 导出标准可复用拓扑 JSON 并通过新槽位直接挂载复用（无需重新解析 DOCX）
const bundle = slot.exportTopologyBundle();
assert.equal(bundle.kind, 'MsdsEngineStandardTopology');
const slot2 = createTopologyPluginSlot();
const bundleStatus = slot2.mountTopologyBundle(bundle);
assert.equal(bundleStatus.mounted, true);
assert.equal(bundleStatus.sectionsCount, 16);
assert.equal(slot2.getMountedProfile().templateKey, profile1.templateKey);
console.log('✅ PASS: 标准拓扑 JSON 对象导出与免解析二次复用通过');

// 5. 拔出模板 / 恢复默认：彻底回到未载入状态
const resetStatus = slot.unmountTemplate();
assert.equal(resetStatus.mounted, false);
assert.equal(resetStatus.templateKey, null);
assert.equal(resetStatus.sourceSha256, null);
assert.equal(resetStatus.sectionsCount, 0);
assert.throws(() => slot.getMountedProfile(), /TOPOLOGY_SLOT_UNMOUNTED/);
console.log('✅ PASS: 拔出模板后已彻底恢复为未载入默认状态');
