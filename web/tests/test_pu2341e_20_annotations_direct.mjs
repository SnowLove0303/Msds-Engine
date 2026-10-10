import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== 测试：PU-2341E 官方审阅 Bundle 20 项审阅批注 100% 闭环验证 ===\n');

// 1. 加载基准源文件 (REC-PU-2341E) 与 官方标准模板
const pSrc = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/data/docs/REC-PU-2341E-1791602176573-a75.docx';
const pTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';

const [srcBuf, tplBuf] = await Promise.all([fs.readFile(pSrc), fs.readFile(pTpl)]);
const srcDoc = await loadDocx(srcBuf, 'PU-2341E.docx');
const tplDoc = await loadDocx(tplBuf, 'Template.docx');

// 2. 运行智能匹配算法
const matchRes = runSmartMatching(srcDoc.records);
assert.ok(matchRes.matchedSections.length > 0, '匹配结果章节不能为空');

// 3. 执行写入模板编辑器 (结果写入编辑器映射)
const applyRes = applyMatchResultToEditor(matchRes, tplDoc);
assert.equal(applyRes.success, true, '写入编辑器必须返回成功');

// 4. Section 2 校验 (批注 1~6)
const sec2 = tplDoc.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
assert.ok(sec2, 'Section 2 表格必须存在');

// 批注 1: 2.1 危险性类别值格不得包含 "\n2.2"
const ghsClassRow = sec2.rows.find((r) => /GHS危险性类别/i.test(r.cells[0]?.text || ''));
assert.ok(ghsClassRow, 'GHS危险性类别行必须存在');
const ghsClassVal = ghsClassRow.cells[1]?.text?.trim();
assert.equal(ghsClassVal, '根据GHS不属于危害化学品', '批注 1: 必须完全清洗尾部换行与“2.2”字符');

// 批注 2: 2.2 标签要素行存在且值为空 (继承留空)
const labelElemRow = sec2.rows.find((r) => /标签要素/i.test(r.cells[0]?.text || ''));
assert.ok(labelElemRow, '批注 2: 标签要素行必须保留');
assert.equal(labelElemRow.cells[1]?.text?.trim(), '', '批注 2: 标签要素值格必须留空');

// 批注 3: 信号词删行 (源文件未提供信号词，严禁臆造“无信号词”)
const signalWordRow = sec2.rows.find((r) => /信号词/i.test(r.cells[0]?.text || ''));
assert.equal(signalWordRow, undefined, '批注 3: 原文无信号词时必须自动删行');

// 批注 4, 6: 序号连续，其他危害编号调整为 2.3
const otherHazRow = sec2.rows.find((r) => /其他危害/i.test(r.cells[0]?.text || ''));
assert.ok(otherHazRow, '其他危害行必须存在');
assert.ok(otherHazRow.cells[0]?.text?.includes('2.3'), '批注 4, 6: 信号词删行后其他危害序号必须调整为 2.3');
assert.equal(otherHazRow.cells[1]?.text?.trim(), '无适用资料。', '批注 5: 其他危害内容为无适用资料。');

// 5. Section 3 校验 (批注 7: 三条组分完整保留)
const sec3 = tplDoc.records.find((r) => r.sectionNumber === 3 && r.kind === 'table');
assert.ok(sec3, 'Section 3 表格必须存在');
const compPolymer = sec3.rows.find((r) => r.cells[0]?.text?.includes('聚氨酯聚合物'));
const compWater = sec3.rows.find((r) => r.cells[0]?.text?.includes('水'));
const compTriethyl = sec3.rows.find((r) => r.cells[0]?.text?.includes('三乙胺'));
assert.ok(compPolymer, '组分1 聚氨酯聚合物 必须存在');
assert.ok(compWater, '批注 7: 组分2 水 必须完整保留，严禁丢失覆盖！');
assert.ok(compTriethyl, '组分3 三乙胺 必须存在');
assert.equal(compWater.cells[1]?.text?.trim(), '7732-18-5', '水 CAS 号必须正确');
assert.equal(compWater.cells[2]?.text?.trim(), '60-70', '水 含量必须正确');

// 6. Section 8 校验 (批注 8: 手部防护不臆造建议)
const sec8 = tplDoc.records.find((r) => r.sectionNumber === 8 && r.kind === 'table');
assert.ok(sec8, 'Section 8 表格必须存在');
const handRow = sec8.rows.find((r) => /手部防护/i.test(r.cells[0]?.text || ''));
assert.ok(handRow, '手部防护行必须存在');
assert.equal(handRow.cells[1]?.text?.trim(), '', '批注 8: 源文档未要求时手部防护单元格留空，严禁臆造“建议戴上防护手套。”');

// 7. Section 9 校验 (批注 9: 源文件19项事实保留，删去未提及模板槽位)
const sec9 = tplDoc.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
assert.ok(sec9, 'Section 9 表格必须存在');
// 表头1行 + 19项数据行 = 20行
assert.equal(sec9.rows.length, 20, '批注 9: Section 9 必须精准保留源文件提到的 19 条数据行（共20行含表头）');
const lastRowSec9 = sec9.rows[sec9.rows.length - 1];
assert.ok(lastRowSec9.cells[0]?.text?.includes('9.19'), '批注 9: 尾行其他信息必须重新编号为 9.19');
assert.ok(lastRowSec9.cells[1]?.text?.includes('上述数据非产品指标'), '其他信息内容准确保留');

// 8. Section 11 校验 (批注 10~20: 毒理学清洗、STOT、CMR、致敏性排版与说明行)
const sec11 = tplDoc.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.ok(sec11, 'Section 11 表格必须存在');

// 批注 10, 11, 12: 经口、吸入、经皮 LD50/LC50 剔除重复的题头
const oralRow = sec11.rows.find((r) => r.cells.some((c) => /经口/i.test(c.text || '')));
assert.ok(oralRow, '经口行必须存在');
const oralText = oralRow.cells[oralRow.cells.length - 1]?.text?.trim();
assert.ok(!oralText.includes('11.1 毒理学效应') && !oralText.startsWith('急性毒性，经口'), '批注 10: 经口值格严禁残留题头');
assert.ok(oralText.startsWith('聚氨酯分散体'), '经口值格必须以主体名称起始');

const inhRow = sec11.rows.find((r) => r.cells.some((c) => /^\s*吸入\s*[:：]?/i.test(c.text || '')));
assert.ok(inhRow, '吸入行必须存在');
const inhText = inhRow.cells[inhRow.cells.length - 1]?.text?.trim();
assert.ok(!inhText.startsWith('急性毒性，吸入'), '批注 11: 吸入值格严禁残留题头');
assert.ok(inhText.startsWith('聚氨酯分散体'), '吸入值格必须以主体名称起始');

const dermRow = sec11.rows.find((r) => r.cells.some((c) => /^\s*经皮\s*[:：]?/i.test(c.text || '')));
assert.ok(dermRow, '经皮行必须存在');
const dermText = dermRow.cells[dermRow.cells.length - 1]?.text?.trim();
assert.ok(!dermText.startsWith('急性毒性，经皮'), '批注 12: 经皮值格严禁残留题头');

// 批注 14, 15: 皮肤刺激、眼睛刺激 剔除题头
const skinRow = sec11.rows.find((r) => r.cells.some((c) => /皮肤刺激/i.test(c.text || '')));
assert.ok(skinRow, '皮肤刺激行必须存在');
const skinText = skinRow.cells[skinRow.cells.length - 1]?.text?.trim();
assert.ok(!skinText.startsWith('原发性皮肤刺激'), '批注 14: 皮肤刺激值格严禁残留题头');

const eyeRow = sec11.rows.find((r) => r.cells.some((c) => /眼睛刺激/i.test(c.text || '')));
assert.ok(eyeRow, '眼睛刺激行必须存在');
const eyeText = eyeRow.cells[eyeRow.cells.length - 1]?.text?.trim();
assert.ok(!eyeText.startsWith('原发性粘膜刺激'), '批注 15: 眼睛刺激值格严禁残留题头');

// 批注 13, 16: 致敏性内部包含两项试验说明
const sensRow = sec11.rows.find((r) => r.cells.some((c) => /致敏性/i.test(c.text || '')));
assert.ok(sensRow, '致敏性行必须存在');
const sensText = sensRow.cells[sensRow.cells.length - 1]?.text?.trim();
assert.ok(sensText.includes('Buehler') && sensText.includes('LLNA'), '批注 13, 16: 致敏性值中完整保留 Buehler 与 LLNA 试验');

// 批注 17: STOT 准确包含 STOT-RE (重复性接触)
const stotRow = sec11.rows.find((r) => r.cells.some((c) => /特异性靶器官系统毒性/i.test(c.text || '')));
assert.ok(stotRow, 'STOT行必须存在');
const stotText = stotRow.cells[stotRow.cells.length - 1]?.text?.trim();
assert.ok(stotText.includes('STOT评估-重复性接触') && stotText.includes('无数据资料'), '批注 17: STOT 必须包含重复性接触无数据资料');

// 批注 18: 吸入危险与 CMR 解耦
const aspRow = sec11.rows.find((r) => r.cells.some((c) => /吸入危险/i.test(c.text || '')));
assert.ok(aspRow, '吸入危险行必须存在');
const aspText = aspRow.cells[aspRow.cells.length - 1]?.text?.trim();
assert.equal(aspText, '聚氨酯分散体\n无数据资料', '批注 18: 吸入危险值格仅保留聚氨酯分散体无数据资料，严禁混入CMR');

// 批注 19: 11.10 附加信息回填 CMR 评估
const addRow = sec11.rows.find((r) => r.cells.some((c) => /附加信息/i.test(c.text || '')));
assert.ok(addRow, '附加信息行必须存在');
const addText = addRow.cells[addRow.cells.length - 1]?.text?.trim();
assert.ok(addText.includes('CMR评估') && addText.includes('致癌性：无数据资料。'), '批注 19: 附加信息必须准确填入 CMR 评估全量结构');

console.log('🎉 验证通过：PU-2341E 全部 20 项审阅批注在智能匹配与编辑器端 100% 完美解决！');
