import { JSDOM } from 'jsdom';
import { renderAsync } from 'docx-preview';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesPath = path.resolve(__dirname, '..', 'src', 'styles.css');
const cssContent = fs.readFileSync(stylesPath, 'utf8');

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="docx-preview-shell">
    <div class="docx-preview-wrapper-holder" id="holder"></div>
  </div>
</body>
</html>
`, { runScripts: 'dangerously' });

global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.XMLSerializer = dom.window.XMLSerializer;
global.DOMParser = dom.window.DOMParser;

const docxPath = path.resolve(__dirname, '..', 'data', 'docs', 'REC-PU-1007-1791602172214-tcw.docx');
const buf = fs.readFileSync(docxPath);
const holder = dom.window.document.getElementById('holder');

// 1. 调用三方库完成原版式渲染（此时库会注入带 background: gray 的 <style> 与 DOM）
await renderAsync(buf, holder, null, {
  className: 'docx-preview',
  inWrapper: true,
  breakPages: true,
  useBase64URL: true,
});

// 2. 挂载生产 styles.css（在 JSDOM 环境中确保层叠规则生效）
const styleEl = dom.window.document.createElement('style');
styleEl.textContent = cssContent;
dom.window.document.head.appendChild(styleEl);

const wrapper = holder.querySelector('.docx-preview-wrapper');
const section = holder.querySelector('section.docx-preview');

console.log('=== DOCX 运行时计算样式断言测试 ===\n');

let checks = 0;
let failures = 0;

function ok(label, condition, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

ok('成功获取到 .docx-preview-wrapper 元素', !!wrapper);
ok('成功获取到 section.docx-preview 页面元素', !!section);

if (wrapper) {
  const wrapperStyle = dom.window.getComputedStyle(wrapper);
  const bg = wrapperStyle.backgroundColor || wrapperStyle.background;
  console.log('  [wrapper 计算样式] background:', bg, 'paddingTop:', wrapperStyle.paddingTop, 'paddingBottom:', wrapperStyle.paddingBottom);

  const isWhite = bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === 'white';
  ok('wrapper 背景计算样式为纯白（无 gray 灰框）', isWhite, `实际值: ${bg}`);

  const not30px = wrapperStyle.paddingTop !== '30px' && wrapperStyle.padding !== '30px';
  ok('wrapper 内边距不再使用库默认的 30px 深灰大边距', not30px, `实际 paddingTop: ${wrapperStyle.paddingTop}`);
}

if (section) {
  const sectionStyle = dom.window.getComputedStyle(section);
  console.log('  [section 计算样式] boxShadow:', sectionStyle.boxShadow, 'background:', sectionStyle.backgroundColor);

  const notHeavyShadow = !sectionStyle.boxShadow.includes('rgba(0, 0, 0, 0.5)') && !sectionStyle.boxShadow.includes('rgba(0,0,0,0.5)');
  ok('section 页面投影已替换库默认 50% 重黑阴影', notHeavyShadow, `实际 boxShadow: ${sectionStyle.boxShadow}`);
}

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  process.exit(1);
}
console.log('DOCX 运行时计算样式断言全部通过！');
