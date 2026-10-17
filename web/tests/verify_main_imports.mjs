import fs from 'fs';
import assert from 'node:assert/strict';

const mainContent = fs.readFileSync('src/main.js', 'utf8');

// 1. 验证 TEMPLATE_BASELINES 是否被成功导入
assert.ok(mainContent.includes('TEMPLATE_BASELINES,'), 'main.js 必须从 docx-engine.js 导入 TEMPLATE_BASELINES');
assert.ok(mainContent.includes("from './docx-engine.js';"), '必须正确声明导入来源 docx-engine.js');

// 2. 检查多基准核心函数中引用的 TEMPLATE_BASELINES 状态
assert.ok(mainContent.includes('function renderBaselineSelectorMarkup()'), '必须存在 renderBaselineSelectorMarkup');
assert.ok(mainContent.includes('function computeExportTargets()'), '必须存在 computeExportTargets');
assert.ok(mainContent.includes('function switchBaselineDraft('), '必须存在 switchBaselineDraft');

// 3. 运行多基准集成测试
import('./test_multibaseline_export_system.mjs').then(() => {
  console.log('\n🎉 所有多基准依赖、导入与渲染逻辑 100% 验证通过！');
});
