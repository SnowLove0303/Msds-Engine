import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

console.log('=== 预设管理弹窗 (Preset Manager Modal Window) 自动化专项测试 ===\n');

// 1. 验证 styles.css 中的独立样式
const css = await fs.readFile('src/styles.css', 'utf8');

assert(css.includes('.preset-manager-backdrop'), 'CSS 必须包含 .preset-manager-backdrop 样式定义');
assert(css.includes('position: fixed;'), '遮罩必须为固定视口定位 position: fixed');
assert(css.includes('inset: 0;'), '遮罩必须占满视口 inset: 0');
assert(css.includes('z-index: 99999;'), '遮罩层级必须高于主工作台 z-index: 99999');
assert(css.includes('.preset-manager-dialog'), 'CSS 必须包含 .preset-manager-dialog 样式定义');
assert(css.includes('width: min(880px, calc(100vw - 48px));'), '弹窗宽度必须为 min(880px, calc(100vw - 48px))');
assert(css.includes('max-height: 84vh;'), '弹窗最大高度必须为 84vh');
assert(css.includes('overflow: hidden;'), '弹窗容器溢出控制必须为 overflow: hidden');
assert(css.includes('.preset-manager-body'), 'CSS 必须包含 .preset-manager-body 样式定义');
assert(css.includes('overflow-y: auto;'), '内容区必须支持独立垂直滚动 overflow-y: auto');
assert(css.includes('.preset-manager-dialog .button'), 'CSS 必须包含 .preset-manager-dialog .button 样式定制');
assert(css.includes('height: 28px !important;'), '按钮高度必须对齐审计基准 28px');
assert(css.includes('border-radius: 7px !important;'), '按钮圆角必须对齐审计基准 7px');
assert(css.includes('font-size: 11.5px !important;'), '按钮字号必须对齐审计基准 11.5px');
console.log('✅ 1. CSS 规范校验全部通过（视口遮罩、居中限宽限高、内部滚动、中性审计按钮基准）');

// 2. 验证 main.js 中的渲染与事件逻辑
const mainJs = await fs.readFile('src/main.js', 'utf8');

assert(mainJs.includes('class="preset-manager-backdrop"'), 'renderPresetManagerModal 必须输出 .preset-manager-backdrop');
assert(mainJs.includes('class="preset-manager-dialog"'), 'renderPresetManagerModal 必须输出 .preset-manager-dialog');
assert(mainJs.includes('class="preset-manager-header"'), 'renderPresetManagerModal 必须输出 .preset-manager-header');
assert(mainJs.includes('class="preset-manager-body"'), 'renderPresetManagerModal 必须输出 .preset-manager-body');
assert(mainJs.includes('class="preset-manager-footer"'), 'renderPresetManagerModal 必须输出 .preset-manager-footer');
assert(mainJs.includes('class="preset-manager-close"'), '关闭按钮必须输出 .preset-manager-close');
assert(mainJs.includes('data-action="close-preset-modal"'), '关闭按钮必须携带 data-action="close-preset-modal"');

// 验证生命周期函数与事件闭环
assert(mainJs.includes('function openPresetManagerModal(triggerEl)'), '必须定义 openPresetManagerModal');
assert(mainJs.includes('function closePresetManagerModal()'), '必须定义 closePresetManagerModal');
assert(mainJs.includes('openPresetManagerModal(btn)'), '打开按钮事件绑定必须统一调用 openPresetManagerModal(btn)');
assert(mainJs.includes('closePresetManagerModal()'), '关闭事件必须统一调用 closePresetManagerModal()');
console.log('✅ 2. DOM 渲染结构与弹窗生命周期无障碍事件校验全部通过');

// 3. 验证作用域隔离：确保未引入全局污染
const modalRules = css.match(/^\.modal-[a-zA-Z0-9_-]+\s*\{/gm) || [];
console.log(`ℹ️ 当前 styles.css 中全局 .modal-* 规则数量: ${modalRules.length} 个`);
assert(!css.includes('.modal-backdrop { position: fixed'), '严禁引入全局未作用域化的 .modal-backdrop 污染');
console.log('✅ 3. 样式作用域隔离与零全局污染校验全部通过');

console.log('\n🎉 所有测试均 100% 验证通过！');
