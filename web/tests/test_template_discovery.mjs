import assert from 'node:assert';
import { discoverAvailableTemplates, resolveDefaultTemplate } from '../src/editor-writer.js';

console.log('=== Running test_template_discovery.mjs ===');

// 1. Discover all templates
const templates = discoverAvailableTemplates();
console.log(`Discovered ${templates.length} templates:`);
for (const t of templates) {
  console.log(`  - ${t.name} (lang=${t.language}, default=${t.isDefault}, custom=${t.isCustom})`);
}

assert(templates.length >= 2, 'Should discover at least 2 standard templates');
const cnTpl = templates.find(t => !t.isCustom && t.name.includes('MSDS_CN_冠志'));
const enTpl = templates.find(t => !t.isCustom && t.name.includes('MSDS_EN_冠志'));
assert(cnTpl, 'Standard CN template must be discovered');
assert(enTpl, 'Standard EN template must be discovered');
assert.strictEqual(cnTpl.language, 'zh', 'CN template language must be zh');
assert.strictEqual(enTpl.language, 'en', 'EN template language must be en');
assert.strictEqual(cnTpl.isDefault, true, 'CN template must be marked default');
assert.strictEqual(enTpl.isDefault, true, 'EN template must be marked default');

// 2. Resolve default templates
const resolvedCn = resolveDefaultTemplate('zh');
console.log(`Resolved CN Default: ${resolvedCn}`);
assert(resolvedCn && resolvedCn.includes('正式模板_MSDS_CN_冠志(1).docx'), 'Resolved CN default should match standard CN template');

const resolvedEn = resolveDefaultTemplate('en');
console.log(`Resolved EN Default: ${resolvedEn}`);
assert(resolvedEn && resolvedEn.includes('正式模板_MSDS_EN_冠志(1).docx'), 'Resolved EN default should match standard EN template');

console.log('✅ ALL TEMPLATE DISCOVERY TESTS PASSED!');
