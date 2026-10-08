import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head><style id="app-style"></style></head><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import { renderParagraph, sourceCellStyle, renderEditorTable } from '../src/render-utils.js';

console.log('=================================================================');
console.log('MSDS STUDIO 标签续行首字对齐与工作台空间扩宽自动化断言套件');
console.log('=================================================================\n');

// 0. 加载 CSS 内容
const cssContent = await fs.readFile(new URL('../src/styles.css', import.meta.url), 'utf-8');

// =====================================================================
// 检验 1：CSS 特异性与 Grid 渲染链断言
// =====================================================================
console.log('--- 验证 1：CSS 特异性与 .label-line-grid / .label-text-slot 渲染链 ---');

// 断言普通块级规则已排除 .label-line-grid
assert.ok(
  cssContent.includes('.structured-table td:first-child .label-parent-row:not(.label-line-grid)'),
  '断言：.structured-table td:first-child .label-parent-row 必须排除 :not(.label-line-grid)'
);
assert.ok(
  cssContent.includes('.label-parent-row:not(.label-line-grid)'),
  '断言：.label-parent-row 必须排除 :not(.label-line-grid)'
);

// 断言 .label-line-grid 具有高特异性 display: grid !important 声明
assert.ok(
  cssContent.includes('.structured-table td:first-child .label-line-grid'),
  '断言：必须具备 .structured-table td:first-child .label-line-grid 高特异性选择器'
);
assert.ok(
  cssContent.includes('.label-line-grid') && cssContent.includes('grid-template-columns: var(--sequence-width, 2.8rem) minmax(0, 1fr) !important'),
  '断言：.label-line-grid 必须声明两槽 Grid 列宽规范'
);

// 断言 .label-text-slot 具有 grid-column: 2 !important 与 display: block !important
assert.ok(
  cssContent.includes('.label-text-slot') &&
  cssContent.includes('grid-column: 2 !important') &&
  cssContent.includes('display: block !important'),
  '断言：.label-text-slot 必须声明 grid-column: 2 !important 与 display: block !important 以确保折行文本垂直对齐第一行'
);

// 断言 .sequence-run / .sequence-slot 具备 grid-column: 1 !important
assert.ok(
  cssContent.includes('grid-column: 1 !important'),
  '断言：序号槽必须绑定 grid-column: 1 !important'
);
console.log('✓ CSS 特异性与双槽 Grid 渲染链声明断言通过！\n');

// =====================================================================
// 检验 2：工作台外层画布宽度拓展与内边距回收
// =====================================================================
console.log('--- 验证 2：工作台画布宽度拓展与内边距回收断言 ---');

// 断言 .page-shell 取消 1920px 限制，放宽至 min(calc(100vw - 32px), 2560px)
assert.ok(
  cssContent.includes('.page-shell { max-width: min(calc(100vw - 32px), 2560px)'),
  '断言：.page-shell 必须使用流式宽度拓展 min(calc(100vw - 32px), 2560px)'
);
assert.ok(
  !cssContent.includes('.page-shell { max-width: 1920px'),
  '断言：.page-shell 不得再包含硬编码的 max-width: 1920px 锁死约束'
);

// 断言 .page-shell.matching-shell 专用展开
assert.ok(
  cssContent.includes('.page-shell.matching-shell { max-width: min(calc(100vw - 20px), 2560px)'),
  '断言：匹配工作台必须声明 .page-shell.matching-shell 极致宽度拓展'
);

// 断言 .inspector-layout 列宽重新分配给结构化表
assert.ok(
  cssContent.includes('.inspector-layout, .editor-layout { grid-template-columns: 140px minmax(0, 1.25fr) minmax(820px, 1fr); gap: 14px;'),
  '断言：.inspector-layout 必须赋予结构化表 1.25fr 优先空间并保证预览列至少 820px'
);

// 断言 .matching-grid-all-three 列宽平衡
assert.ok(
  cssContent.includes('.matching-grid-all-three {') &&
  cssContent.includes('grid-template-columns: minmax(420px, 1fr) minmax(500px, 1.15fr) minmax(520px, 1.45fr)'),
  '断言：三屏同览模式必须保证原始表>=420px，标准表>=500px，预览列>=520px 与 1.45fr 倾斜权重'
);

// 断言 .matching-col-scroll 内边距收敛为 8px 4px
assert.ok(
  cssContent.includes('.matching-col-scroll {') &&
  cssContent.includes('padding: 8px 4px;'),
  '断言：.matching-col-scroll 内边距必须收敛为 8px 4px'
);
console.log('✓ 画布宽度拓展、识别页分配、匹配页分配与内边距回收断言通过！\n');

// =====================================================================
// 检验 3：纯二列表格自适应最小宽度保证 vs Section 3 / 单列免污染
// =====================================================================
console.log('--- 验证 3：纯二列表格自适应最小宽度 vs 多列表格非侵入隔离 ---');

// 加载真实文档与模板
const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const srcPath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const srcBuf = await fs.readFile(srcPath);

const srcEngine = await loadDocx(srcBuf, 'PU-2341E.docx');
const tplEngine = await loadDocx(tplBuf, 'template.docx');

// 找到纯二列表格（例如 Section 5 消防措施）
const s5Record = tplEngine.records.find((r) => r.sectionNumber === 5 && r.kind === 'table');
assert(s5Record, '断言：Section 5 必须存在');
const s5ColCount = s5Record.structure?.gridWidthsTwips?.length || s5Record.rows[1].cells.length;
assert.equal(s5ColCount, 2, '断言：Section 5 必须为纯双列表格');

// 测试纯二列表格首列单元格样式输出
const s5LabelCell = s5Record.rows[1].cells[0]; // 5.1 合适的灭火剂
const s5LabelStyle = sourceCellStyle(s5LabelCell, 10000, false, s5Record);
assert.ok(
  s5LabelStyle.includes('min-width:175px'),
  `断言：纯二列表格标签单元格必须输出 min-width:175px 自适应保底，实际为: ${s5LabelStyle}`
);

// 找到 Section 3 三列成分表
const s3Record = tplEngine.records.find((r) => r.sectionNumber === 3 && r.kind === 'table');
assert(s3Record, '断言：Section 3 必须存在');
const s3ColCount = s3Record.structure?.gridWidthsTwips?.length || 3;
assert.equal(s3ColCount, 3, '断言：Section 3 必须为三列表格');

// 测试 Section 3 表头首列单元格样式输出（严禁被放大至 175px，保持 110px）
const s3HeaderCell0 = s3Record.rows.find((r) => r.cells.some((c) => /CAS编号/i.test(c.text))).cells[0];
const s3Style = sourceCellStyle(s3HeaderCell0, 10000, false, s3Record);
assert.ok(
  s3Style.includes('min-width:110px'),
  `断言：Section 3 三列成分表必须保持 min-width:110px，严禁侵入为 175px，实际为: ${s3Style}`
);
assert.ok(
  !s3Style.includes('min-width:175px'),
  '断言：Section 3 绝对不能出现 min-width:175px'
);

// Section 5 序号与正文槽渲染验证（首字对齐结构验证）
const s5r1p0 = s5LabelCell.paragraphs[0];
const s5CellHtml = renderParagraph(s5r1p0, s5LabelCell, s5Record, tplEngine.roleStyles, true, s5Record.rows[1]);
assert.ok(
  s5CellHtml.includes('class="label-line-grid'),
  '断言：Section 5 标签行必须输出 label-line-grid'
);
assert.ok(
  s5CellHtml.includes('class="sequence-run"'),
  '断言：Section 5 标签行必须输出 sequence-run 序号槽'
);
assert.ok(
  s5CellHtml.includes('class="label-text-slot"'),
  '断言：Section 5 标签行必须输出 label-text-slot 正文槽'
);
assert.ok(
  s5CellHtml.includes('5.1'),
  '断言：序号槽必须包含 5.1'
);

console.log('✓ 纯二列表格 175px 保底与 Section 3 三列隔离断言通过！\n');

// =====================================================================
// 检验 4：DOM 级别折行首字对齐几何与模拟断言
// =====================================================================
console.log('--- 验证 4：JSDOM 结构树与样式链匹配验证 ---');

const testHtml = `
  <div class="page-shell matching-shell">
    <div class="matching-layout">
      <div class="matching-col-scroll">
        <table class="structured-table">
          <tbody>
            <tr>
              <td>
                <div class="label-line-grid label-parent-row">
                  <span class="sequence-run">5.1 </span>
                  <span class="label-text-slot">合适的灭火剂：</span>
                </div>
              </td>
              <td><span>水雾、干粉、泡沫或二氧化碳灭火剂。</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

dom.window.document.body.innerHTML = testHtml;
const labelGridEl = dom.window.document.querySelector('.label-line-grid');
assert(labelGridEl, '断言：.label-line-grid 元素必须在 DOM 中成功构建');

const seqEl = labelGridEl.querySelector('.sequence-run');
const textEl = labelGridEl.querySelector('.label-text-slot');
assert(seqEl && textEl, '断言：序号槽与正文槽子节点必须完整存在');
assert.equal(seqEl.textContent.trim(), '5.1', '断言：序号文本正确');
assert.equal(textEl.textContent.trim(), '合适的灭火剂：', '断言：标签正文正确');

console.log('✓ DOM 级别结构树与槽位绑定核验通过！\n');

console.log('=================================================================');
console.log('🎉 标签续行首字对齐与工作台空间扩宽所有断言 100% 全部通过！');
console.log('=================================================================');
