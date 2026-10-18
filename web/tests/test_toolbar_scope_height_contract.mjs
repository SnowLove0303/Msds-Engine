#!/usr/bin/env node
/**
 * 工具栏作用域高度契约静态断言测试。
 *
 * 对应 openspec change `editor-preview-heading-overlap`：
 * 规则：若工具栏作用域启用了 `flex-wrap: wrap`（允许内容在窄容器下换行），
 * 其布局高度必须为自适应（`height: auto`），严禁与固定高度（如 `height: 38px`）并存，
 * 否则换行溢出的控件将无法撑开容器，被其后相邻容器遮挡。
 *
 * 用法：node tests/test_toolbar_scope_height_contract.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesCssPath = path.resolve(__dirname, '..', 'src', 'styles.css');
const mainJsPath = path.resolve(__dirname, '..', 'src', 'main.js');

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

/**
 * 解析 styles.css 中的 [data-toolbar-scope="..."] 规则块
 * @param {string} cssContent
 * @returns {Map<string, { raw: string, height?: string, minHeight?: string, flexShrink?: string }>}
 */
export function parseToolbarScopes(cssContent) {
  const scopes = new Map();
  const regex = /\[data-toolbar-scope=["']([^"']+)["']\]\s*\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    const scopeName = match[1];
    const body = match[2];
    const getProp = (prop) => {
      const m = body.match(new RegExp(`(?<![\\w-])${prop}\\s*:\\s*([^;]+);`));
      return m ? m[1].trim() : undefined;
    };
    scopes.set(scopeName, {
      raw: body,
      height: getProp('height'),
      minHeight: getProp('min-height'),
      flexShrink: getProp('flex-shrink'),
    });
  }
  return scopes;
}

/**
 * 检查在给定 CSS 内容与 mainJs 内容下，所有换行工具栏是否满足高度契约
 * @param {string} cssContent
 * @param {string} jsContent
 * @returns {{ violations: Array<{ scope: string, reason: string }> }}
 */
export function checkToolbarHeightContract(cssContent, jsContent) {
  const scopes = parseToolbarScopes(cssContent);
  const violations = [];

  for (const [scope, props] of scopes.entries()) {
    // 检查 CSS 或 JS 中是否声明了换行
    const hasWrapInCss = /flex-wrap\s*:\s*wrap/i.test(props.raw);
    const scopeInJsRegex = new RegExp(`data-toolbar-scope=["']${scope}["'][^>]*style=["'][^"']*flex-wrap\\s*:\\s*wrap`, 'i');
    const hasWrapInJs = scopeInJsRegex.test(jsContent);
    const allowsWrap = hasWrapInCss || hasWrapInJs;

    if (allowsWrap) {
      const isFixedHeight = props.height && /^\d+px$/i.test(props.height);
      const isAutoHeight = !props.height || props.height === 'auto';
      if (isFixedHeight || !isAutoHeight) {
        violations.push({
          scope,
          reason: `允许换行但高度被固定为 ${props.height}，未设置为自适应 height: auto`,
        });
      }
    }
  }

  return { violations };
}

console.log('=== 工具栏作用域高度契约测试 ===\n');

const css = fs.readFileSync(stylesCssPath, 'utf8');
const js = fs.readFileSync(mainJsPath, 'utf8');
const scopes = parseToolbarScopes(css);

console.log('场景 1：已声明的作用域完备性与审计');
const expectedScopes = [
  'editor-file-ribbon',
  'editor-section-heading',
  'editor-table-heading',
  'editor-preview-heading',
];
for (const s of expectedScopes) {
  ok(`作用域 ${s} 存在于 styles.css`, scopes.has(s));
}

console.log('\n场景 2：editor-preview-heading 修复后契约');
const previewScope = scopes.get('editor-preview-heading');
ok('editor-preview-heading 存在', Boolean(previewScope));
ok('editor-preview-heading 的 height 为 auto', previewScope?.height === 'auto');
ok('editor-preview-heading 的 min-height 为 38px', previewScope?.minHeight === '38px');
ok('editor-preview-heading 显式声明 flex-shrink: 0', previewScope?.flexShrink === '0');

console.log('\n场景 3：全作用域无「固定高度 + 换行」违规');
const result = checkToolbarHeightContract(css, js);
ok('当前代码库中零违规作用域', result.violations.length === 0, JSON.stringify(result.violations));

console.log('\n场景 4：负向验证（将 height 篡改回 38px 时必须断言失败）');
const badCss = css.replace(
  /(\[data-toolbar-scope="editor-preview-heading"\][\s\S]*?height:\s*)auto(;)/,
  '$138px$2'
);
const badResult = checkToolbarHeightContract(badCss, js);
ok(
  '篡改回固定高度后正确检测到违规',
  badResult.violations.some((v) => v.scope === 'editor-preview-heading'),
  '期望失败但未失败'
);

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('工具栏作用域高度契约测试全部通过！\n');
}
