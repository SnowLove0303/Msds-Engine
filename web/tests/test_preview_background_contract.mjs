#!/usr/bin/env node
/**
 * DOCX 预览视口背景契约静态断言测试。
 *
 * 对应 openspec change `preview-gray-frame-removal`：
 * 规则：DOCX 预览视口不得形成对比灰底框。
 * 视口（.docx-preview-shell）、内层容器（.docx-preview）、动态包装层（.docx-preview-wrapper）
 * 与既有页面外壳（.docx-wrapper）的背景色必须与页面/容器底色连续一致（#ffffff），
 * 严禁使用 #dbe2e8 或 #eef2f5 灰底，且必须强力覆盖三方库注入的 gray。
 *
 * 用法：node tests/test_preview_background_contract.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesCssPath = path.resolve(__dirname, '..', 'src', 'styles.css');

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
 * 提取 styles.css 中关于预览外壳背景色的关键声明
 * @param {string} css
 */
export function auditPreviewBackgrounds(css) {
  const issues = [];
  const bannedColors = [/#dbe2e8/i, /#eef2f5/i];

  // 1. 检查主组选择器包含 .docx-preview-shell 与 .docx-preview-wrapper
  const groupMatch = css.match(/(\.docx-preview-shell[\s\S]*?\.docx-preview-wrapper[\s\S]*?)\{([^}]+)\}/);
  if (!groupMatch) {
    issues.push('未找到包含 .docx-preview-wrapper 的主预览外壳组选择器规则块');
  } else {
    const body = groupMatch[2];
    for (const banned of bannedColors) {
      if (banned.test(body)) {
        issues.push(`主预览外壳组选择器中仍包含禁用灰底色 ${banned}`);
      }
    }
    if (!/background\s*:\s*#ffffff/i.test(body)) {
      issues.push('主预览外壳组选择器未显式配置为 #ffffff');
    }
  }

  // 2. 检查 .docx-preview-shell.matching-preview
  const matchingMatch = css.match(/\.docx-preview-shell\.matching-preview\s*\{([^}]+)\}/);
  if (matchingMatch) {
    const body = matchingMatch[1];
    for (const banned of bannedColors) {
      if (banned.test(body)) {
        issues.push(`matching-preview 中仍包含禁用灰底色 ${banned}`);
      }
    }
  }

  // 3. 检查全局是否有针对 .docx-preview 或 .docx-preview-shell 的残留旧灰底声明
  const lines = css.split('\n');
  lines.forEach((line, index) => {
    if (/\.(docx-preview-shell|docx-preview|docx-wrapper)/.test(line)) {
      for (const banned of bannedColors) {
        if (banned.test(line)) {
          issues.push(`第 ${index + 1} 行检测到预览相关旧灰底残留声明：${line.trim()}`);
        }
      }
    }
  });

  return { valid: issues.length === 0, issues };
}

console.log('=== DOCX 预览视口背景契约测试 ===\n');

const css = fs.readFileSync(stylesCssPath, 'utf8');

console.log('场景 1：生产样式表背景色审计');
const audit = auditPreviewBackgrounds(css);
ok('所有预览外壳规则均消除对比灰框', audit.valid, audit.issues.join('; '));

console.log('\n场景 2：关键选择器无禁用色值');
ok('样式表中不存在 #dbe2e8 灰底', !/#dbe2e8/i.test(css));
const previewHasEef2f5 = /\.docx-preview[^{}]*\{[^}]*#eef2f5/i.test(css);
ok('预览视口规则中不存在 #eef2f5', !previewHasEef2f5);
ok('样式表显式覆盖 .docx-preview-wrapper 真实类名', /\.docx-preview-wrapper/.test(css));

console.log('\n场景 3：负向验证（人为引入 #eef2f5 灰底时必须断言失败）');
const badCss = css.replace(
  /(\.docx-preview-shell[\s\S]*?background:\s*)#ffffff/,
  '$1#eef2f5'
);
const badAudit = auditPreviewBackgrounds(badCss);
ok('检测到人为注入的 #eef2f5 灰底', !badAudit.valid && badAudit.issues.some((i) => /#eef2f5/.test(i)));

const badCss2 = css.replace(
  /(\.docx-preview-shell[\s\S]*?background:\s*)#ffffff/,
  '$1#dbe2e8'
);
const badAudit2 = auditPreviewBackgrounds(badCss2);
ok('检测到人为注入的 #dbe2e8 灰底', !badAudit2.valid && badAudit2.issues.some((i) => /#dbe2e8/.test(i)));

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('DOCX 预览视口背景契约测试全部通过！\n');
}
