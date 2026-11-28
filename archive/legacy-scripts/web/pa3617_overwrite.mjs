import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import {
  loadDocx, writeCellValue, writeCellLabel, addRowAfter, deleteRow,
  renumberRecord, auditEngine,
} from './src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const TPL = './public/templates/正式模板_MSDS_CN_冠志(1).docx';
const SRC = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN（冠志）.docx';
const OUT = 'F:/MSDS覆写/MSDS deepseek 工作区/PA-3617_msds_CN_冠志_覆写版.docx';

const engine = await loadDocx(await fs.promises.readFile(TPL), 'tpl.docx');
const src = await loadDocx(await fs.promises.readFile(SRC), 'src.docx');
const RS = engine.roleStyles.value;

const sec = (n) => engine.records.find((r) => r.kind === 'table' && r.sectionNumber === n);
const ssec = (n) => src.records.find((r) => r.kind === 'table' && r.sectionNumber === n);
const refetch = (n) => engine.records.find((r) => r.kind === 'table' && r.sectionNumber === n);
const valCell = (row) => row.cells.find((c) => c.editable && c.valueNodes.length && c.col > 0)
  || row.cells.find((c) => c.editable && c.valueNodes.length);
function W(rec, ri, text) {
  const cell = valCell(rec.rows[ri]);
  if (!cell) throw new Error(`S${rec.sectionNumber} R${ri} 无可写值格`);
  writeCellValue(cell, text, RS);
  return cell;
}
function DEL(n, indexesDesc) {
  let rec = sec(n);
  for (const i of indexesDesc) {
    rec = deleteRow(engine, rec, i);
  }
  return refetch(n);
}
// 源引擎取值：按标签正则找行，取其值格文本
function SV(n, re) {
  const rec = ssec(n);
  const row = rec.rows.find((r) => re.test(r.cells[0]?.text || ''));
  if (!row) throw new Error(`源S${n} 未命中 ${re}`);
  const c = row.cells.find((x) => x.valueText) || row.cells[row.cells.length - 1];
  const t = c.valueText || c.labelText || c.text;
  if (!t.trim()) throw new Error(`源S${n} ${re} 值为空`);
  return t;
}
const splitLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

// ---------- S1 ----------
{
  const model = SV(1, /产品名称/);
  const cnName = SV(1, /中文名称/);
  if (!/PA-3617/.test(model)) throw new Error('型号核对失败:' + model);
  W(sec(1), 2, `${cnName} ${model}`);
  W(sec(1), 3, SV(1, /化学品分类/));
  W(sec(1), 4, SV(1, /使用建议/));
  W(sec(1), 6, SV(1, /供应商名称/));
  W(sec(1), 7, SV(1, /供应商地址/));
  W(sec(1), 8, SV(1, /电话/));
  W(sec(1), 9, SV(1, /传真/));
}

// ---------- S2: 仅分类+象形图有源，其余整行删 ----------
{
  W(sec(2), 2, '根据GHS不属于危险物');
  W(sec(2), 4, '无');
  DEL(2, [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 3, 1]);
}

// ---------- S3: 两组分 ----------
{
  const rec = ssec(3);
  const srow = rec.rows.find((r) => /丙烯酸共聚物/.test(r.cells[0]?.text || ''));
  const names = splitLines(srow.cells[0].text), cass = splitLines(srow.cells[1].text), concs = splitLines(srow.cells[2].text);
  if (names.length !== 2) throw new Error('源S3组分行数=' + names.length);
  let r = sec(3);
  names.forEach((nm, i) => {
    const row = r.rows[4 + i];
    writeCellValue(row.cells[0], nm, RS);
    writeCellValue(row.cells[1], cass[i], RS);
    writeCellValue(row.cells[2], concs[i], RS);
  });
  W(sec(3), 1, '混合物');
}

// ---------- S4 ----------
{
  const s = sec(4);
  W(s, 1, SV(4, /一般措施/));
  W(s, 2, SV(4, /误服/));
  W(s, 3, SV(4, /接触眼睛/));
  let skin = SV(4, /接触皮肤/);
  if (!/[。.]$/.test(skin)) skin += '。';
  W(s, 4, skin);
  W(s, 5, SV(4, /吸入/));
}

// ---------- S5 ----------
{
  const s = sec(5);
  let a = SV(5, /合适的灭火剂/);
  if (!/[。.]$/.test(a)) a += '。';
  W(s, 1, a);
  W(s, 2, SV(5, /不合适的灭火剂/));
  W(s, 3, SV(5, /特殊危害/).split('\n')[0] + '\n在着火或爆炸情况下，不要吸进烟尘。');
  const f = SV(5, /消防预防/).split('\n');
  W(s, 4, f.join('\n'));
}

// ---------- S6 / S7 ----------
{
  const s = sec(6);
  const p = SV(6, /个人预防/).split('\n');
  W(s, 1, p.join('\n'));
  W(s, 2, SV(6, /环境保护/));
  W(s, 3, SV(6, /收集和清除/));
  const t = sec(7);
  W(t, 1, SV(7, /安全操作/).split('\n').join('\n'));
  W(t, 2, SV(7, /安全储存/).split('\n').join('\n'));
}

// ---------- S8 ----------
{
  let r = sec(8);
  const v = (ri, t, opts = {}) => {
    const row = r.rows[ri];
    const c = row.cells.filter((x) => x.editable && x.valueNodes.length).at(-1);
    if (!c) {
      if (opts.skipIfLocked) { console.log(`WARN S8 R${ri} 模板值格为空，引擎不可写，已跳过: ${t.slice(0, 20)}`); return; }
      throw new Error('S8 R' + ri + ' 无值格');
    }
    writeCellValue(c, t, RS);
  };
  v(2, SV(8, /呼吸系统防护/));
  v(3, '建议戴上防护手套。');
  v(4, SV(8, /合适材料/));
  v(5, '厚度≧0.4mm；穿透时间≧480min.');
  v(6, '厚度≧0.5mm；穿透时间≧480min.');
  v(7, '厚度≧0.35mm；穿透时间≧480min.');
  v(8, SV(8, /^建议/), { skipIfLocked: true });
  v(9, SV(8, /眼睛防护/));
  v(10, SV(8, /身体防护/));
  v(11, SV(8, /EC指令|接触限值/));
  r = deleteRow(engine, r, 15);
  r = deleteRow(engine, r, 14);
  r = deleteRow(engine, r, 13);
  r = deleteRow(engine, r, 12);
}

// ---------- S9 ----------
function fixS9Numbers(rec) {
  let n = 0;
  for (const row of rec.rows.slice(1)) {
    const lc = row.cells[0];
    if (!/^\s*9\.\d+/.test(lc.text)) continue;
    n++;
    const p = lc.paragraphs[0];
    const run = p.runs.find((x) => /^\s*9\.\d+\s*$/.test(x.text)) || p.runs[0];
    const tn = run.textNodes[0];
    tn.textContent = tn.textContent.replace(/^\s*\d+\.\d+/, `9.${n}`);
    run.text = run.textNodes.map((t) => t.textContent).join('');
    p.text = p.runs.map((x) => x.text).join('');
    p.rawText = p.text;
    lc.text = lc.paragraphs.map((q) => q.text).join('\n').trim();
    lc.labelText = lc.paragraphs.map((q) => q.runs.filter((x) => x.bold).map((x) => x.text).join('')).join('\n').trim();
  }
  return n;
}
{
  // 按模板行号锚定写值（写前断言标签含预期属性，防串行），删行在写后
  const pmap = [
    [1, '外观', '微黄半透明液体'], [3, 'pH值', '8.0-9.0'], [4, '离子性', '阴离子'],
    [5, '初沸点', '约100℃'], [6, '闪点', '不适用'], [8, '可燃性', '不适用'],
    [9, '燃烧值', '不适用'], [12, '密度', '1.0-1.1g/cm3'], [13, '水溶性', '完全混溶'],
    [16, '自燃温度', '不适用'], [19, '动力粘度', '＜200mPa.s'], [22, '固体含量', '41±2%'],
    [23, '其他信息', '上述数据非产品指标，产品指标请参见产品技术信息表。'],
  ];
  let r = sec(9);
  const NEG = ['相对蒸气密度', '饱和蒸气压', '表面张力', '辛醇', '引燃温度', '分解温度', '爆炸特性', '粉尘爆炸'];
  for (const [ri, name, val] of pmap) {
    const label = r.rows[ri].cells[0]?.labelText || '';
    if (!label.includes(name) || NEG.some((x) => label.includes(x) && !name.includes(x))) {
      throw new Error(`模板S9 R${ri}标签不符预期${name}: ` + label);
    }
    const c = r.rows[ri].cells.find((x) => x.editable && x.valueNodes.length);
    writeCellValue(c, val, RS);
  }
  // 纯缺失整行删（自底向上）
  for (const i of [21, 20, 18, 17, 15, 14, 11, 10, 7, 2]) r = deleteRow(engine, r, i);
  // 新增 MFFT / Tg（克隆动力粘度行）
  r = refetch(9);
  const visc = r.rows.findIndex((row, i) => i > 0 && row.cells[0]?.labelText.includes('动力粘度'));
  r = addRowAfter(engine, r, visc);
  let mfft = r.rows[visc + 1];
  writeCellLabel(mfft.cells[0], '最低成膜温度MFFT/℃：', true, engine.roleStyles.label);
  writeCellValue(mfft.cells.find((x) => x.editable && x.valueNodes.length), '30', RS);
  r = refetch(9);
  const mfftIdx = r.rows.findIndex((row, i) => i > 0 && row.cells[0]?.labelText.includes('最低成膜温度'));
  r = addRowAfter(engine, r, mfftIdx);
  const tg = r.rows[mfftIdx + 1];
  writeCellLabel(tg.cells[0], '玻璃化温度Tg/℃：', true, engine.roleStyles.label);
  writeCellValue(tg.cells.find((x) => x.editable && x.valueNodes.length), '-10', RS);
  r = refetch(9);
  const n = fixS9Numbers(r);
  console.log('S9 props:', n);
}

// ---------- S10 ----------
{
  const s = sec(10);
  W(s, 1, SV(10, /化学稳定性/));
  W(s, 2, SV(10, /危险分解产物/));
  W(s, 3, SV(10, /可能的危害反应/));
  deleteRow(engine, s, 5);
  deleteRow(engine, refetch(10), 4);
}

// ---------- S11 ----------
{
  let r = sec(11);
  const wv = (ri, t) => {
    const row = r.rows[ri];
    const c = row.cells.filter((x) => x.editable && x.valueNodes.length).at(-1);
    writeCellValue(c, t, RS);
  };
  wv(2, '类似产品的风险评估数据：');
  wv(3, '半数致死剂量（LD50）/大鼠：＞2,000mg/kg。');
  wv(7, '无刺激');
  wv(8, '轻微刺激');
  wv(9, '皮肤接触不致敏');
  wv(10, '在AMES试验中无致突变性。');
  for (const i of [17, 16, 15, 14, 13, 12, 11, 6, 5, 4]) r = deleteRow(engine, r, i);
}

// ---------- S12 ----------
{
  let r = sec(12);
  const wv = (ri, t) => {
    const row = r.rows[ri];
    writeCellValue(row.cells.find((x) => x.editable && x.valueNodes.length), t, RS);
  };
  wv(3, SV(12, /生态毒性/));
  wv(4, SV(12, /持久性/));
  wv(5, SV(12, /其他/));
  r = deleteRow(engine, r, 2);
  deleteRow(engine, refetch(12), 1);
}

// ---------- S13 / S14 / S15 ----------
{
  const t = sec(13);
  W(t, 1, SV(13, /必需遵守/).split('\n').join('\n'));
  W(t, 2, SV(13, /处理方法/).split('\n').join('\n'));
  const u = sec(14);
  W(u, 1, SV(14, /公路/));
  W(u, 2, SV(14, /海上/));
  W(u, 3, SV(14, /空运/));
  W(u, 4, SV(14, /特殊注意/).split('\n').join('\n'));
  const v = sec(15);
  const regs = ['591号', '16483', '13690', '30000', '15258'].map((k) => {
    const row = v.rows.find((r) => r.cells[0]?.valueText.includes(k));
    if (!row) throw new Error('模板S15缺法规:' + k);
    return row;
  });
  const srcRegs = ['危险化学品安全管理条例，国务院令591号', 'GB/T 16483 化学品安全技术说明书内容和项目顺序', 'GB 13690 化学品分类和危险性公示通则', 'GB 30000.2-29 化学品分类和标签规范', 'GB 15258 化学品安全标签编写规定'];
  regs.forEach((row, i) => writeCellValue(row.cells[0], srcRegs[i], RS));
}

// ---------- 题头/页脚产品标识 ----------
// 引擎限制：exportArrayBuffer 仅回写 word/document.xml，页眉页脚改动必然丢失，
// 且页眉题头格不可编辑（ed=false）。PEA-4139 题头/页脚保持模板原样，见报告。

const errs = auditEngine(engine);
console.log('audit errors:', JSON.stringify(errs));
if (errs.length) throw new Error('审计未通过');
const out = await engine.exportArrayBuffer();
await fs.promises.writeFile(OUT, Buffer.from(out));
console.log('saved:', OUT);
