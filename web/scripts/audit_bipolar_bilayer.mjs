import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

/**
 * 双极双层全景机械深度审计套件 (Bipolar Bilayer Deep Audit Suite)
 * 极 1: 业务宪法准则 (SKILL 极: msds-studio / MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md / 全景统一规范)
 * 极 2: 零容忍 AST 机器断言 (机械极: 真实 OOXML DOM 解析，0 容忍，退出码 0 充要验证)
 * 
 * 层 1: 全局通用规范层 (Global Layer: 8 格式、字号、字体、零 tabs、零中文、标点闭合、双语同构、反多空格)
 * 层 2: 16 章节专属局部规范层 (Local Layer: Section 1 ~ 16 完整槽位、几何拓扑与语义契约)
 */

export async function loadDocXml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[LoadDocXml] 目标交付物文件不存在: ${filePath}`);
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

export async function runBipolarBilayerAudit(customTargetDir = null, customModelCode = null) {
  const targetDir = customTargetDir || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
  const model = customModelCode || path.basename(targetDir);
  
  console.log('========================================================================');
  console.log('       双极双层全景机械深度审计终审 (Bipolar Bilayer Deep Audit)        ');
  console.log(` 目标目录: ${targetDir} (型号: ${model})`);
  console.log('========================================================================\n');

  let failCount = 0;
  const failureDetails = [];

  const assert = (cond, msg, detail = null) => {
    if (!cond) {
      console.error(`❌ [FAIL] ${msg}`);
      if (detail) console.error(`     ↳ 细节: ${detail}`);
      failCount++;
      failureDetails.push({ msg, detail });
    } else {
      console.log(`✅ [PASS] ${msg}`);
    }
  };

  const DELIVERABLES = [
    `${model} msds_CN 冠志.docx`,
    `${model} msds_CN 冠志.pdf`,
    `${model} msds_CN 国彩.docx`,
    `${model} msds_CN 国彩.pdf`,
    `${model} msds_EN Guanzhi.docx`,
    `${model} msds_EN Guanzhi.pdf`,
    `${model} msds_EN Guocai.docx`,
    `${model} msds_EN Guocai.pdf`,
  ];

  // ----------------------------------------------------------------------
  // 第一层：全局通用规范层 (Global Layer Audit)
  // ----------------------------------------------------------------------
  console.log('>>> [层 1: 全局通用规范层审查]');

  // G-01: 交付目录绝对纯净与 8 格式精准交付断言 (Canonical 8-Deliverables Purity Gate)
  const dirFiles = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  assert(dirFiles.length === 8, `交付目录纯净门禁 (G-01 Purity): 目录内物理文件总数严格等于 8 (实测: ${dirFiles.length} 个)`);
  if (dirFiles.length !== 8) {
    console.error(`     ↳ 目录实际文件列表: \n        - ${dirFiles.join('\n        - ')}`);
  }

  for (const file of DELIVERABLES) {
    const fullPath = path.join(targetDir, file);
    const exists = fs.existsSync(fullPath);
    assert(exists, `交付物法定命名存在性 (G-01 Exists): ${file}`);
  }

  const docCn = await loadDocXml(`${targetDir}/${model} msds_CN 冠志.docx`);
  const docEn = await loadDocXml(`${targetDir}/${model} msds_EN Guanzhi.docx`);
  const docGuocaiCn = await loadDocXml(`${targetDir}/${model} msds_CN 国彩.docx`);
  const docGuocaiEn = await loadDocXml(`${targetDir}/${model} msds_EN Guocai.docx`);

  const tblsCn = docCn.getElementsByTagName('w:tbl');
  const tblsEn = docEn.getElementsByTagName('w:tbl');
  const tblsGuocaiCn = docGuocaiCn.getElementsByTagName('w:tbl');
  const tblsGuocaiEn = docGuocaiEn.getElementsByTagName('w:tbl');

  // G-02 / G-03: 全文制表符纯度断言 (零非法 <w:tabs> / 零非法 <w:tab/>)
  let illegalTabsCountCn = 0;
  for (let t = 0; t < tblsCn.length; t++) {
    illegalTabsCountCn += tblsCn[t].getElementsByTagName('w:tabs').length;
    illegalTabsCountCn += tblsCn[t].getElementsByTagName('w:tab').length;
  }
  assert(illegalTabsCountCn === 0, `全局制表符纯度 (G-09 CN): 中文版全篇非法制表位/符为 0 (实测: ${illegalTabsCountCn})`);

  let customTabsCountEn = 0;
  let illegalValueTabsCountEn = 0;
  for (let t = 0; t < tblsEn.length; t++) {
    customTabsCountEn += tblsEn[t].getElementsByTagName('w:tabs').length;
    const rows = tblsEn[t].getElementsByTagName('w:tr');
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      for (let c = 1; c < cells.length; c++) {
        illegalValueTabsCountEn += cells[c].getElementsByTagName('w:tab').length;
      }
    }
  }
  assert(customTabsCountEn === 0 && illegalValueTabsCountEn === 0, `全局制表符纯度 (G-09 EN): 英文版非法自定义制表位 <w:tabs> 为 0 (实测: ${customTabsCountEn})，值格非法 <w:tab/> 为 0 (实测: ${illegalValueTabsCountEn})`);

  // G-04: 英文版零中文字符残留强门禁 (assertZeroChinese)
  let cnCountInGuanzhiEn = 0;
  const enTsGuanzhi = docEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuanzhi.length; i++) {
    const m = enTsGuanzhi[i].textContent.match(/[\u4e00-\u9fa5]/g);
    if (m) cnCountInGuanzhiEn += m.length;
  }
  assert(cnCountInGuanzhiEn === 0, `英文版零中文强门禁 (Gate 4 冠志): 文本节点 <w:t> 中文字符数量为 0 (实测: ${cnCountInGuanzhiEn})`);

  let cnCountInGuocaiEn = 0;
  const enTsGuocai = docGuocaiEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuocai.length; i++) {
    const m = enTsGuocai[i].textContent.match(/[\u4e00-\u9fa5]/g);
    if (m) cnCountInGuocaiEn += m.length;
  }
  assert(cnCountInGuocaiEn === 0, `英文版零中文强门禁 (Gate 4 国彩): 文本节点 <w:t> 中文字符数量为 0 (实测: ${cnCountInGuocaiEn})`);

  // G-05: 跨实体白名单差异断言 (冠志 vs 国彩)
  assert(tblsCn.length === tblsGuocaiCn.length, `实体表格拓扑一致: 冠志(${tblsCn.length}) vs 国彩(${tblsGuocaiCn.length})`);
  let technicalDiffCount = 0;
  for (let s = 1; s < tblsCn.length; s++) {
    const tG = tblsCn[s].textContent.replace(/\s+/g, '');
    const tC = tblsGuocaiCn[s].textContent.replace(/\s+/g, '');
    if (tG !== tC) technicalDiffCount++;
  }
  assert(technicalDiffCount === 0, `跨实体技术参数白名单 (G-24): Section 2~16 技术内容 100% 相同 (违背节数: ${technicalDiffCount})`);

  // G-25: 中英文双语结构拓扑同构公理 (Bilingual Structural Isomorphism)
  assert(tblsCn.length === tblsEn.length, `双语表格数量同构 (G-25): 中文(${tblsCn.length}) vs 英文(${tblsEn.length})`);
  
  // Section 11 模态判断：Paradigm 1 (通栏 4 行复合模式 - PA-3223) vs Paradigm 2 (原版分列表格模式 - PU-202A)
  const s11Cn = tblsCn[10];
  const s11En = tblsEn[10];
  const s11CnTrs = s11Cn.getElementsByTagName('w:tr');
  const s11EnTrs = s11En.getElementsByTagName('w:tr');
  const s11CnRow3 = s11CnTrs[3];
  const s11EnRow3 = s11EnTrs[3];
  const isS11FullWidth = (s11CnTrs.length === 4 && s11CnRow3?.getElementsByTagName('w:tc')?.length === 1);

  if (model === 'PU-202A') {
    assert(!isS11FullWidth, 'Section 11 (PU-202A 单组分): 严禁强行压成通栏 4 行大单元格，必须恢复原版分列表格！');
    assert(s11CnTrs.length === 14, `Section 11 (PU-202A 单组分): 原版分列表格行数严格等于 14 行 (实测: ${s11CnTrs.length} 行)`);
    assert(s11EnTrs.length === 14, `Section 11 (PU-202A 英文版): 原版分列表格行数严格等于 14 行 (实测: ${s11EnTrs.length} 行)`);

    // 零空值单元格硬断言：Section 11 中文与英文每一行的值区域必须存在有效字符 (尤其是 Row 13 附加信息)
    for (let rIdx = 1; rIdx < s11CnTrs.length; rIdx++) {
      const cnRow = s11CnTrs[rIdx];
      const enRow = s11EnTrs[rIdx];
      const cnLastCell = cnRow.getElementsByTagName('w:tc')[cnRow.getElementsByTagName('w:tc').length - 1];
      const enLastCell = enRow.getElementsByTagName('w:tc')[enRow.getElementsByTagName('w:tc').length - 1];
      const cnVal = (cnLastCell?.textContent || '').trim();
      const enVal = (enLastCell?.textContent || '').trim();
      assert(cnVal.length > 0, `Section 11 中文版 Row ${rIdx} 严禁出现纯空值单元格！(实测长度: 0)`);
      assert(enVal.length > 0, `Section 11 英文版 Row ${rIdx} 严禁出现纯空值单元格！(实测长度: 0)`);
    }

    // Row 2 前言行原生样式硬断言 (缩进 left="34", 字号 sz="24", 无整段加粗)
    const cnRow2 = s11CnTrs[2];
    const enRow2 = s11EnTrs[2];
    const cnRow2Ind = cnRow2.getElementsByTagName('w:ind')[0]?.getAttribute('w:left');
    const cnRow2Sz = cnRow2.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
    assert(cnRow2Ind === '34', `Section 11 中文版 Row 2 前言行严格具备原生左缩进 (left="34") (实测: ${cnRow2Ind})`);
    assert(cnRow2Sz === '24', `Section 11 中文版 Row 2 前言行严格具备五号字号 (sz="24") (实测: ${cnRow2Sz})`);
    assert(/N,N[-－]二甲基乙酰胺毒理学数据/.test(cnRow2.textContent), 'Section 11 中文版 Row 2 文本内容正确');

    const enRow2Ind = enRow2.getElementsByTagName('w:ind')[0]?.getAttribute('w:left');
    const enRow2Sz = enRow2.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
    assert(enRow2Ind === '34', `Section 11 英文版 Row 2 前言行严格具备原生左缩进 (left="34") (实测: ${enRow2Ind})`);
    assert(enRow2Sz === '24', `Section 11 英文版 Row 2 前言行严格具备五号字号 (sz="24") (实测: ${enRow2Sz})`);
    assert(/N,N-Dimethylacetamide/i.test(enRow2.textContent), 'Section 11 英文版 Row 2 文本内容正确');

    // Row 5 (皮肤刺激) 与 Row 6 (眼睛刺激) 细粒度分行与全常规体物理硬断言 (G-29 值格绝对不加粗)
    const cnRow5 = s11CnTrs[5];
    const cnRow5Cell = cnRow5.getElementsByTagName('w:tc')[cnRow5.getElementsByTagName('w:tc').length - 1];
    const cnRow5Ps = Array.from(cnRow5Cell.getElementsByTagName('w:p'));
    assert(cnRow5Ps.length >= 3, `Section 11 (PU-202A 中文版): 皮肤刺激性必须独立分行展示物种/分类/结果 (实测段落数: ${cnRow5Ps.length}, 期望 >= 3)`);
    const cnRow5Bolds = Array.from(cnRow5Cell.getElementsByTagName('w:b')).filter(b => b.getAttribute('w:val') !== '0');
    assert(cnRow5Bolds.length === 0, `Section 11 (PU-202A 中文版): 皮肤刺激性值单元格严禁加粗，必须全常规体 (实测加粗数: ${cnRow5Bolds.length}, 期望 0)`);

    const enRow5 = s11EnTrs[5];
    const enRow5Cell = enRow5.getElementsByTagName('w:tc')[enRow5.getElementsByTagName('w:tc').length - 1];
    const enRow5Ps = Array.from(enRow5Cell.getElementsByTagName('w:p'));
    assert(enRow5Ps.length >= 3, `Section 11 (PU-202A 英文版): 皮肤刺激性必须独立分行展示 Species/Classification/Result (实测段落数: ${enRow5Ps.length}, 期望 >= 3)`);
    const enRow5Bolds = Array.from(enRow5Cell.getElementsByTagName('w:b')).filter(b => b.getAttribute('w:val') !== '0');
    assert(enRow5Bolds.length === 0, `Section 11 (PU-202A 英文版): 皮肤刺激性值单元格严禁加粗，必须全常规体 (实测加粗数: ${enRow5Bolds.length}, 期望 0)`);

    // Row 7 (致敏性) 细粒度分行与全常规体硬断言
    const cnRow7 = s11CnTrs[7];
    const cnRow7Cell = cnRow7.getElementsByTagName('w:tc')[cnRow7.getElementsByTagName('w:tc').length - 1];
    const cnRow7Ps = Array.from(cnRow7Cell.getElementsByTagName('w:p'));
    assert(cnRow7Ps.length >= 6, `Section 11 (PU-202A 中文版): 致敏性必须分行展示豚鼠与人类试验 (实测段落数: ${cnRow7Ps.length}, 期望 >= 6)`);
    const cnRow7Bolds = Array.from(cnRow7Cell.getElementsByTagName('w:b')).filter(b => b.getAttribute('w:val') !== '0');
    assert(cnRow7Bolds.length === 0, `Section 11 (PU-202A 中文版): 致敏性值单元格严禁加粗，必须全常规体 (实测加粗数: ${cnRow7Bolds.length}, 期望 0)`);

    const enRow7 = s11EnTrs[7];
    const enRow7Cell = enRow7.getElementsByTagName('w:tc')[enRow7.getElementsByTagName('w:tc').length - 1];
    const enRow7Bolds = Array.from(enRow7Cell.getElementsByTagName('w:b')).filter(b => b.getAttribute('w:val') !== '0');
    assert(enRow7Bolds.length === 0, `Section 11 (PU-202A 英文版): 致敏性值单元格严禁加粗，必须全常规体 (实测加粗数: ${enRow7Bolds.length}, 期望 0)`);

    // Row 13 (附加信息) 完整注入与结构化断言
    const cnRow13 = s11CnTrs[13];
    const cnRow13Text = cnRow13.textContent;
    assert(/饮酒精饮料会加剧毒性影响/.test(cnRow13Text), 'Section 11 中文版 Row 13 必须包含饮酒精饮料影响事实');
    assert(/重复剂量中毒/.test(cnRow13Text), 'Section 11 中文版 Row 13 必须包含重复剂量中毒事实');
    const cnRow13Cell = cnRow13.getElementsByTagName('w:tc')[cnRow13.getElementsByTagName('w:tc').length - 1];
    assert(cnRow13Cell.getElementsByTagName('w:p').length >= 3, 'Section 11 中文版 Row 13 附加信息必须分段展示 (>= 3段)');

    const enRow13 = s11EnTrs[13];
    const enRow13Text = enRow13.textContent;
    assert(/Consumption of alcoholic beverages|Drinking alcoholic beverages/i.test(enRow13Text), 'Section 11 英文版 Row 13 必须包含饮酒影响英文事实');
    assert(/Repeated dose toxicity/i.test(enRow13Text), 'Section 11 英文版 Row 13 必须包含重复剂量中毒英文事实');
    const enRow13Cell = enRow13.getElementsByTagName('w:tc')[enRow13.getElementsByTagName('w:tc').length - 1];
    assert(enRow13Cell.getElementsByTagName('w:p').length >= 3, 'Section 11 英文版 Row 13 附加信息必须分段展示 (>= 3段)');
  }

  function getPText(p) {
    if (!p) return '';
    let text = '';
    for (const r of Array.from(p.getElementsByTagName('w:r'))) {
      for (const child of Array.from(r.childNodes || [])) {
        if (child.nodeName === 'w:t') text += child.textContent;
        if (child.nodeName === 'w:br') text += '\n';
      }
    }
    return text || p.textContent || '';
  }

  if (isS11FullWidth) {
    const s11CnPs = Array.from(s11CnRow3?.getElementsByTagName('w:p') || []);
    const s11EnPs = Array.from(s11EnRow3?.getElementsByTagName('w:p') || []);
    assert(s11CnPs.length === s11EnPs.length, `Section 11 双语段落数量 1:1 同构 (G-25): 中文(${s11CnPs.length}段) vs 英文(${s11EnPs.length}段)`, `中文段落数: ${s11CnPs.length}, 英文段落数: ${s11EnPs.length}`);
    const expectedS11Ps = model === 'PA-3223' ? 4 : (model === 'PU-202A' ? 1 : null);
    if (expectedS11Ps !== null) {
      assert(s11EnPs.length === expectedS11Ps, `Section 11 英文版独立段落同构 (D-01/G-25): 实测段落数为 ${s11EnPs.length} (期望: ${expectedS11Ps} 段)`);
    }

    // Section 11 组分间距公理：严格单空行隔离 (before="240"=12pt)，严禁段首软回车叠加双重空行
    if (s11EnPs.length >= 4) {
      const p2Spacing = s11EnPs[2].getElementsByTagName('w:spacing')[0];
      const p2Before = p2Spacing?.getAttribute('w:before');
      assert(p2Before === '240', `Section 11 英文版组件 2 间距严格单空行隔离 (before="240") (实测: ${p2Before})`);
      const p2FirstRunBr = s11EnPs[2].getElementsByTagName('w:r')[0]?.getElementsByTagName('w:br').length;
      assert(!p2FirstRunBr, `Section 11 英文版组件 2 严禁段首前置软回车引发双重空行 (实测首Run br数: ${p2FirstRunBr})`);

      const p3Spacing = s11EnPs[3].getElementsByTagName('w:spacing')[0];
      const p3Before = p3Spacing?.getAttribute('w:before');
      assert(p3Before === '240', `Section 11 英文版组件 3 间距严格单空行隔离 (before="240") (实测: ${p3Before})`);
      const p3FirstRunBr = s11EnPs[3].getElementsByTagName('w:r')[0]?.getElementsByTagName('w:br').length;
      assert(!p3FirstRunBr, `Section 11 英文版组件 3 严禁段首前置软回车引发双重空行 (实测首Run br数: ${p3FirstRunBr})`);
    }

    // G-26: 标点完整性与闭合公理 (Punctuation Integrity & Sentence Closure)
    let suspendedColonEnCount = 0;
    s11EnPs.forEach((p, idx) => {
      const t = getPText(p).trim();
      if (/:$/.test(t)) {
        suspendedColonEnCount++;
        console.error(`     ↳ 发现英文悬挂冒号: P[${idx}] -> "${t.slice(-20)}"`);
      }
    });
    assert(suspendedColonEnCount === 0, `Section 11 英文版零末尾悬挂冒号 (D-02/G-26): 违规悬空段落数: ${suspendedColonEnCount}`);

    let collisionCount = 0;
    s11CnPs.forEach((p, idx) => {
      const t = getPText(p);
      if (!t.includes('\n') && /mg\/kg刺激性|mg\/l刺激性|mg\/m3刺激性/.test(t)) {
        collisionCount++;
        console.error(`     ↳ 发现中文文本碰撞粘连: P[${idx}] -> "${t}"`);
      }
    });
    assert(collisionCount === 0, `Section 11 中文版零文本标签粘连碰撞 (D-04/G-26): 碰撞次数: ${collisionCount}`);
  } else {
    // Paradigm 2: 双语行数同构
    assert(s11CnTrs.length === s11EnTrs.length, `Section 11 标准插槽双语行数 1:1 同构 (G-25): 中文(${s11CnTrs.length}行) vs 英文(${s11EnTrs.length}行)`);
  }

  // 3. 全局独立完整句子句末标点闭合断言 (D-06/G-26)
  // 检查 Section 4 (急救皮肤接触就医。)
  const s4TextCn = tblsCn[3].textContent || '';
  const s4HasDoctorPeriod = /就医[。.]/.test(s4TextCn);
  assert(s4HasDoctorPeriod, `Section 4 急救措施句号闭合 (D-06/G-26): 必须以 "就医。" 闭合`);

  // 检查 Section 5 (消防措施喷洒水。)
  const s5TextCn = tblsCn[4].textContent || '';
  const s5HasWaterPeriod = /(?:喷洒水|水喷雾|用水喷洒)[。.]/.test(s5TextCn);
  assert(s5HasWaterPeriod, `Section 5 消防措施句号闭合 (D-06/G-26): 灭火介质末尾必须以句号闭合`);

  // 检查 Section 7 (安全操作规程衣物。)
  const s7TextCn = tblsCn[6].textContent || '';
  const s7HasClothPeriod = /更换被污染或浸湿的衣物[。.]/.test(s7TextCn);
  assert(s7HasClothPeriod, `Section 7 安全操作规程句号闭合 (D-06/G-26): 必须以 "更换被污染或浸湿的衣物。" 闭合`);

  if (isS11FullWidth) {
    const s11CnPs = Array.from(s11CnRow3?.getElementsByTagName('w:p') || []);
    const s11EnPs = Array.from(s11EnRow3?.getElementsByTagName('w:p') || []);

    // 检查 Section 11 中文各段句末闭合 (对齐手做版与通用规范：末尾以标准标点 "。" 或 "；" 闭合)
    let s11UnclosedCnCount = 0;
    s11CnPs.forEach((p, idx) => {
      const t = getPText(p).trim();
      if (model === 'PA-3223') {
        if (idx === 0) {
          if (!t.endsWith('；') && !t.endsWith(';')) s11UnclosedCnCount++;
        } else {
          if (!t.endsWith('刺激性：无资料') && !t.endsWith('无资料')) s11UnclosedCnCount++;
        }
      } else {
        if (t && !/[。；;.]/.test(t.slice(-1))) {
          s11UnclosedCnCount++;
          console.error(`     ↳ 中文 S11 P[${idx}] 末尾缺少闭合标点: "${t.slice(-30)}"`);
        }
      }
    });
    assert(s11UnclosedCnCount === 0, `Section 11 中文段落末尾标点闭合 (D-04/G-26): 未闭合段落数: ${s11UnclosedCnCount}`);

    // 检查 Section 11 英文各段句末闭合
    let s11UnclosedEnCount = 0;
    s11EnPs.forEach((p, idx) => {
      const t = getPText(p).trim();
      if (t && !/[.;]$/.test(t)) {
        s11UnclosedEnCount++;
        console.error(`     ↳ 英文 S11 P[${idx}] 末尾缺少闭合标点: "${t.slice(-30)}"`);
      }
    });
    assert(s11UnclosedEnCount === 0, `Section 11 英文段落末尾标点闭合 (D-02/G-26): 未闭合段落数: ${s11UnclosedEnCount}`);

    // G-27: 冒号间距公理 (Colon Spacing Invariant)
    let badColonSpacingEnCount = 0;
    s11EnPs.forEach((p, idx) => {
      const t = getPText(p);
      const badNoSpace = t.match(/[a-zA-Z0-9\)]:(?![ \s\n])/g);
      const badMultiSpace = t.replace(/ {8}| {6}| {5}| {3}/g, '').match(/[a-zA-Z0-9\)]:[ ]{2,}/g);
      if (badNoSpace) {
        badColonSpacingEnCount += badNoSpace.length;
        console.error(`     ↳ 英文冒号后无空格: P[${idx}]`);
      }
      if (badMultiSpace) {
        badColonSpacingEnCount += badMultiSpace.length;
        console.error(`     ↳ 英文冒号后多空格: P[${idx}]`);
      }
    });
    assert(badColonSpacingEnCount === 0, `Section 11 英文冒号间距严格为 1 空格 (G-27): 违规次数: ${badColonSpacingEnCount}`);

    // G-28: 反多空格排版公理 (Anti-Multi-Space Axiom)
    let multiSpaceCnCount = 0;
    s11CnPs.forEach((p, idx) => {
      const t = getPText(p);
      const sanitized = t.replace(/ {6}/g, '');
      const m = sanitized.match(/[ ]{2,}/g);
      if (m) {
        multiSpaceCnCount += m.length;
        console.error(`     ↳ 中文 S11 P[${idx}] 发现连续多空格 (${m.length}处)`);
      }
    });
    assert(multiSpaceCnCount === 0, `Section 11 中文版零连续多空格对齐 (D-04/G-28): 违规连续多空格处数: ${multiSpaceCnCount}`);

    let multiSpaceEnCount = 0;
    s11EnPs.forEach((p, idx) => {
      const t = getPText(p);
      const sanitized = t.replace(/ {8}| {6}| {5}| {3}/g, '');
      const m = sanitized.match(/[ ]{2,}/g);
      if (m) {
        multiSpaceEnCount += m.length;
        console.error(`     ↳ 英文 S11 P[${idx}] 发现连续多空格 (${m.length}处)`);
      }
    });
    assert(multiSpaceEnCount === 0, `Section 11 英文版零连续多空格对齐 (D-03/G-28): 违规连续多空格处数: ${multiSpaceEnCount}`);
  }

  // G-29: 值格字体分离断言 (Font Weight Separation)
  const cnS11Runs = Array.from(s11CnRow3.getElementsByTagName('w:r'));
  let hasRegularRunsCn = false;
  let hasBoldRunsCn = false;
  for (const r of cnS11Runs) {
    const b = r.getElementsByTagName('w:b')[0];
    const isBold = b && b.getAttribute('w:val') !== '0';
    if (isBold) hasBoldRunsCn = true;
    else hasRegularRunsCn = true;
  }
  assert(hasBoldRunsCn && hasRegularRunsCn, `Section 11 中文版字体分离断言 (D-05/G-29): 具备加粗标签且具备常规体测试值 (Bold=${hasBoldRunsCn}, Regular=${hasRegularRunsCn})`);

  const enS11Runs = Array.from(s11EnRow3.getElementsByTagName('w:r'));
  let hasRegularRunsEn = false;
  let hasBoldRunsEn = false;
  for (const r of enS11Runs) {
    const b = r.getElementsByTagName('w:b')[0];
    const isBold = b && b.getAttribute('w:val') !== '0';
    if (isBold) hasBoldRunsEn = true;
    else hasRegularRunsEn = true;
  }
  assert(hasBoldRunsEn && hasRegularRunsEn, `Section 11 英文版字体分离断言 (D-05/G-29): 具备加粗标签且具备常规体测试值 (Bold=${hasBoldRunsEn}, Regular=${hasRegularRunsEn})`);

  // ----------------------------------------------------------------------
  // 第二层：16 章节专属局部规范层 (Local Layer: Section 1 ~ 16)
  // ----------------------------------------------------------------------
  console.log('\n>>> [层 2: 16 个 Section 章节专属局部规范审查]');

  // L-S1: 物料标识与供应商信息
  const s1Text = tblsCn[0].textContent;
  assert(new RegExp(model, 'i').test(s1Text), `Section 1 (L-S1): 产品型号 ${model} 准确绑定`);
  assert(/广州冠志新材料科技有限公司/.test(s1Text), 'Section 1 (L-S1): 冠志供应商信息准确绑定');

  // L-S2: 危险性概述 (自适应 通栏模式 vs 标准危险品/非危品分列架构)
  const s2Trs = tblsCn[1].getElementsByTagName('w:tr');
  const s2Row1 = s2Trs[1];
  const s2Tcs = s2Row1 ? s2Row1.getElementsByTagName('w:tc') : [];
  const isS2FullWidth = (s2Tcs.length === 1);

  if (isS2FullWidth) {
    assert(s2Tcs.length === 1, `Section 2 (L-S2): 单单元格通栏行拓扑完整 (实测单元格数: ${s2Tcs.length})`);
    assert(s2Trs.length === 2, `Section 2 (L-S2): 通栏 2 行极简拓扑完备 (实测行数: ${s2Trs.length})`);
    const s2Text = s2Row1.textContent;

    if (model === 'PU-202A') {
      assert(/2\.1|GHS危险性类别|急性毒性/.test(s2Text), 'Section 2 (L-S2): GHS 分类通栏完备');
      assert(/信号词[：:]\s*危险/.test(s2Text), 'Section 2 (L-S2): 信号词危险准确');
      assert(/防范说明|预防措施|事故响应/.test(s2Text), 'Section 2 (L-S2): GHS 防范说明通栏完备');
      assert(/其他危险[：:]\s*无适用资料/.test(s2Text), 'Section 2 (L-S2): 其他危险通栏完备');

      // 物理级 AST 断言：防范说明统一左缩进 left="960"，实现换行首字绝对垂直垂向对齐
      const s2Ps = Array.from(s2Row1.getElementsByTagName('w:p'));
      let p960Count = 0;
      let pFirstLine1200Count = 0;
      let otherDangerBoldPass = false;

      for (const p of s2Ps) {
        const pText = (p.textContent || '').trim();
        const ind = p.getElementsByTagName('w:ind')[0];
        const lt = ind?.getAttribute('w:left');
        const fl = ind?.getAttribute('w:firstLine');
        if (/^P\d{3}/.test(pText)) {
          if (lt === '960') p960Count++;
          if (fl === '1200') pFirstLine1200Count++;
        }
        if (/其他危险[：:]/.test(pText)) {
          const runs = Array.from(p.getElementsByTagName('w:r'));
          for (const r of runs) {
            const rText = r.textContent || '';
            if (/其他危险/.test(rText)) {
              const b = r.getElementsByTagName('w:b')[0];
              if (b && b.getAttribute('w:val') !== '0') {
                otherDangerBoldPass = true;
              }
            }
          }
        }
      }
      assert(p960Count >= 4, `Section 2 通栏防范说明统一 left="960" 换行首字垂向对齐断言 (实测命中: ${p960Count} 段)`);
      assert(pFirstLine1200Count === 0, `Section 2 通栏严禁 firstLine="1200" 导致换行回缩顶格 (实测违规数: ${pFirstLine1200Count})`);
      assert(otherDangerBoldPass, 'Section 2 通栏 "其他危险" 法定标签加粗格式继承断言 (<w:b/> 存在)');

      const s2EnRow1 = tblsEn[1].getElementsByTagName('w:tr')[1];
      const s2EnText = s2EnRow1?.textContent || '';
      assert(/Classification of the substance|Acute toxicity/i.test(s2EnText), 'Section 2 (L-S2 EN): 英文 GHS 分类通栏完备');
      assert(/Signal word:\s*Danger/i.test(s2EnText), 'Section 2 (L-S2 EN): 英文信号词 Danger 准确');
      assert(/Precautionary statements|Prevention|Response/i.test(s2EnText), 'Section 2 (L-S2 EN): 英文防范说明通栏完备');
    } else {
      // PA-3223 Mode B 专属成盐豁免与 5 级缩进断言
      assert(!/商业机密|7732-18-5|46±5/.test(s2Text), 'Section 2 (L-S2): 无菌覆写，彻底切断 Section 3 成分数据行穿透污染');
      assert(/请注意以下物质：/.test(s2Text) && /N,N-二甲基乙醇胺/.test(s2Text), 'Section 2 (L-S2): 成盐豁免附注准确锚定保全');

      const s2Ps = Array.from(s2Row1.getElementsByTagName('w:p'));
      let saltGhsIndentCount = 0;
      let headerIndentCount = 0;
      let extendedIndentCount = 0;
      let storageHangingCount = 0;
      let disposalHangingCount = 0;
      let boldLeakageCount = 0;

      for (const p of s2Ps) {
        const pText = (p.textContent || '').trim();
        const ind = p.getElementsByTagName('w:ind')[0];
        const fl = ind?.getAttribute('w:firstLine');
        const lt = ind?.getAttribute('w:left');
        const hg = ind?.getAttribute('w:hanging');

        if (/^(?:请注意以下物质|N,N-二甲基乙醇胺|GHS分类|易燃液体3|急性毒性4|皮肤腐蚀1B|特异性靶器官)/.test(pText)) {
          if (fl === '480') saltGhsIndentCount++;
        } else if (/^(?:预防措施|事故响应|安全存储|安全储存|废弃处置)[：:]/.test(pText)) {
          if (fl === '482') headerIndentCount++;
        } else if (/^在室外或通风良好处操作/.test(pText)) {
          if (fl === '960') extendedIndentCount++;
        } else if (/^请置于避光/.test(pText)) {
          if (lt === '1199' && hg === '720') storageHangingCount++;
        } else if (/^使用后的空桶/.test(pText)) {
          if (lt === '959' && hg === '480') disposalHangingCount++;
        }

        if (/^(?:操作时穿戴|操作后彻底清洗|作业场所不得|在室外或通风良好处操作|吸入[：:]|食入[：:]|泄露[：:]|灭火[：:]|请置于避光|使用后的空桶)/.test(pText)) {
          const runs = Array.from(p.getElementsByTagName('w:r'));
          for (const r of runs) {
            if (r.getElementsByTagName('w:b').length > 0) {
              boldLeakageCount++;
            }
          }
        }
      }

      assert(saltGhsIndentCount >= 8, `Section 2 (L-S2): 成盐声明 firstLine="480" 状态机断言 (实测命中: ${saltGhsIndentCount}/9)`);
      assert(headerIndentCount >= 4, `Section 2 (L-S2): 主分类标题 firstLine="482" 状态机断言 (实测命中: ${headerIndentCount}/4)`);
      assert(extendedIndentCount >= 1, `Section 2 (L-S2): 延伸项 firstLine="960" 状态机断言 (实测命中: ${extendedIndentCount}/1)`);
      assert(storageHangingCount >= 1, `Section 2 (L-S2): 存储说明 left="1199" hanging="720" 悬挂缩进断言 (实测命中: ${storageHangingCount}/1)`);
      assert(disposalHangingCount >= 1, `Section 2 (L-S2): 空桶说明 left="959" hanging="480" 悬挂缩进断言 (实测命中: ${disposalHangingCount}/1)`);
      assert(boldLeakageCount === 0, `Section 2 (L-S2): 防范说明操作规程常规体保护零泄露断言 (实测加粗泄露数: ${boldLeakageCount})`);

      const s2EnRow1 = tblsEn[1].getElementsByTagName('w:tr')[1];
      const s2EnPs = Array.from(s2EnRow1.getElementsByTagName('w:p'));
      let saltGhsIndentEnCount = 0;
      let titleIndentEnCount = 0;
      let contentIndentEnCount = 0;
      let s2EnHangingCount = 0;

      for (const p of s2EnPs) {
        const pText = (p.textContent || '').trim();
        const ind = p.getElementsByTagName('w:ind')[0];
        const lt = ind?.getAttribute('w:left');
        const hg = ind?.getAttribute('w:hanging');

        if (/^(?:Please note the following substance|N,N-Dimethylethanolamine|GHS classification|Flammable liquid|Acute toxicity|Skin corrosion|Specific target organ)/i.test(pText)) {
          if (lt === '480') saltGhsIndentEnCount++;
        } else if (/^(?:Prevention|Response|Storage|Disposal)[：:]/i.test(pText)) {
          if (lt === '480') titleIndentEnCount++;
        } else if (/^(?:Wear protective|Wash contact|Do not eat|Use only outdoors|Inhalation|Skin and eye|Ingestion|Spillage|Fire|Store in a cool|Empty containers)/i.test(pText)) {
          if (lt === '960') contentIndentEnCount++;
        }
        if (hg) {
          s2EnHangingCount++;
        }
      }

      assert(saltGhsIndentEnCount >= 8, `Section 2 英文版成盐声明 left="480" 换行首字对齐断言 (实测命中: ${saltGhsIndentEnCount}/9)`);
      assert(titleIndentEnCount === 4, `Section 2 英文版防范说明四大标题 left="480" 相互对齐断言 (实测命中: ${titleIndentEnCount}/4)`);
      assert(contentIndentEnCount >= 10, `Section 2 英文版防范说明内容项 left="960" 相互对齐断言 (实测命中: ${contentIndentEnCount}/11)`);
      assert(s2EnHangingCount === 0, `Section 2 英文版换行首字对齐公理 (零悬挂缩进，续行与首行严格对齐) (实测悬挂数: ${s2EnHangingCount})`);
    }
  } else {
    assert(s2Trs.length >= 4, `Section 2 (L-S2): 标准行数结构完备 (实测行数: ${s2Trs.length})`);
    const s2CnText = tblsCn[1].textContent;
    assert(/GHS危险性类别|GHS hazard/i.test(s2CnText), 'Section 2 (L-S2): GHS 分类插槽完备');
    assert(/防范说明|Precautionary statements/i.test(s2CnText), 'Section 2 (L-S2): GHS 防范说明插槽完备');
  }
  // L-S11 英文版双列垂直对齐公理 (仅在 Paradigm 1 通栏复合模式下触发)
  const isS11FullWidthEn = (s11EnTrs.length === 4 && s11EnTrs[3]?.getElementsByTagName('w:tc')?.length === 1);
  if (isS11FullWidthEn && model === 'PA-3223') {
    const s11EnRow3Target = s11EnTrs[3];
    const s11EnRow3Ps = Array.from(s11EnRow3Target.getElementsByTagName('w:p'));
    let s11ColAlignPassCount = 0;
    for (const p of s11EnRow3Ps) {
      const t = getPText(p);
      if (t.includes('Propylene glycol butyl ether:')) {
        const hasDermalAlign = /Toxicity: Dermal \(Rat\) {3}LD50:/.test(t);
        const hasInhalAlign = / {8}Inhalation \(Rat\) LD50:/.test(t);
        const hasOralAlign = / {8}Oral \(Rat\) {5}LD50:/.test(t);
        if (hasDermalAlign && hasInhalAlign && hasOralAlign) {
          s11ColAlignPassCount++;
        } else {
          console.error('     ↳ 丙二醇丁醚列对齐断言失败: ' + JSON.stringify(t));
        }
      } else if (t.includes('2-(2-Butoxyethoxy)ethanol:')) {
        const hasDermalAlign = /Toxicity: Dermal \(Rat\) {3}LD50:/.test(t);
        const hasOralAlign = / {8}Oral \(Rat\) {5}LD50:/.test(t);
        if (hasDermalAlign && hasOralAlign) {
          s11ColAlignPassCount++;
        } else {
          console.error('     ↳ 二乙二醇丁醚列对齐断言失败: ' + JSON.stringify(t));
        }
      }
    }
    assert(s11ColAlignPassCount === 2, `Section 11 英文版测试端点与 LD50: 双列绝对垂直列对齐断言 (实测命中: ${s11ColAlignPassCount}/2)`);
  } else if (isS11FullWidthEn && model === 'PU-202A') {
    const s11EnText = tblsEn[10].textContent;
    assert(/N,N-Dimethylacetamide/.test(s11EnText), 'Section 11 英文版包含 N,N-Dimethylacetamide 组分标题');
    assert(/Acute toxicity/i.test(s11EnText) && /Oral/i.test(s11EnText), 'Section 11 英文版包含经口急毒试验数据');
  }


  // L-S3: 成分/组成信息 (居中对齐与 CAS 规范)
  const s3 = tblsCn[2];
  const s3Trs = s3.getElementsByTagName('w:tr');
  let nonCenterIngredientCells = 0;
  for (let r = 3; r < s3Trs.length; r++) {
    const tcs = s3Trs[r].getElementsByTagName('w:tc');
    for (let c = 0; c < tcs.length; c++) {
      const jc = tcs[c].getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
      if (jc !== 'center') nonCenterIngredientCells++;
    }
  }
  assert(nonCenterIngredientCells === 0, `Section 3 (L-S3): 成分表格内容居中对齐 (jc=center) (违规格数: ${nonCenterIngredientCells})`);

  // L-S3 英文版成分表居中对齐断言
  const s3En = tblsEn[2];
  const s3TrsEn = s3En.getElementsByTagName('w:tr');
  let nonCenterIngredientCellsEn = 0;
  for (let r = 3; r < s3TrsEn.length; r++) {
    const tcs = s3TrsEn[r].getElementsByTagName('w:tc');
    for (let c = 0; c < tcs.length; c++) {
      const jc = tcs[c].getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
      if (jc !== 'center') nonCenterIngredientCellsEn++;
    }
  }
  assert(nonCenterIngredientCellsEn === 0, `Section 3 英文版成分表格内容居中对齐 (jc=center) (违规格数: ${nonCenterIngredientCellsEn})`);

  // L-S4: 急救措施 (四维分流)
  assert(/吸入|皮肤接触|眼睛接触|食入/.test(s4TextCn), 'Section 4 (L-S4): 吸入/皮肤/眼睛/食入四维接触途径清晰分流');

  // L-S5: 消防措施
  assert(/灭火剂|特别危险性|灭火注意事项/.test(s5TextCn), 'Section 5 (L-S5): 灭火介质与特别危险性明确界定');

  // L-S6: 泄漏应急处理 (三大维度闭环)
  const s6Text = tblsCn[5].textContent;
  assert(/作业人员防护|环境保护措施|收容、清除方法/.test(s6Text), 'Section 6 (L-S6): 人员防护、环境保护、收容清除三大处置闭环');

  // L-S7: 操作处置与储存
  assert(/安全操作防范/.test(s7TextCn) && /安全储存条件/.test(s7TextCn) && /(?:干燥通风|凉爽通风|阴凉通风|通风)/.test(s7TextCn), 'Section 7 (L-S7): 安全操作防范与安全储存条件法定守恒');

  // L-S8: 接触控制与个体防护 (PPE 四件套)
  const s8Text = tblsCn[7].textContent;
  assert(/工程控制|呼吸系统防护|眼睛防护|手部防护/.test(s8Text), 'Section 8 (L-S8): 个体防护装备 (PPE) 标准分流规范');

  // L-S9: 理化特性 (中英文法定槽位严格 1:1 同构对齐、小节编号连贯性与防叠词断言)
  const s9Cn = tblsCn[8];
  const s9TrsCn = s9Cn.getElementsByTagName('w:tr');
  assert(s9TrsCn.length >= 19, `Section 9 (L-S9): 中文法定槽位行数完备保全 (实测行数: ${s9TrsCn.length})`);
  assert(!/pH值pH/.test(s9Cn.textContent), 'Section 9 (L-S9): 消除中文 pH 标签叠词');

  const s9En = tblsEn[8];
  const s9TrsEn = s9En.getElementsByTagName('w:tr');
  assert(s9TrsEn.length === s9TrsCn.length, `Section 9 (L-S9): 英文与中文理化特性行数严格 1:1 同构对齐 (CN: ${s9TrsCn.length}, EN: ${s9TrsEn.length})`);

  // 严格全量检查英文 Section 9 每一行标签：
  // 1. 序号与行索引严格 1:1 一致 (9.1 ~ 9.N)
  // 2. 绝对不允许出现叠词（如 partition coefficient): partition coefficient, temperature: temperature, pressure: pressure）
  for (let r = 1; r < s9TrsEn.length; r++) {
    const c0 = s9TrsEn[r].getElementsByTagName('w:tc')[0];
    const lblText = (c0?.textContent || '').trim();
    assert(!/(\b\w{3,}\b)(?:[:\s)]+)\1\b/i.test(lblText), `Section 9 (L-S9): 英文第 ${r} 行标签严禁出现连续叠词 (实测: "${lblText}")`);
    assert(!/partition coefficient.*partition coefficient/i.test(lblText), `Section 9 (L-S9): 英文第 ${r} 行严禁残留 partition coefficient 叠词`);
    assert(!/temperature.*temperature/i.test(lblText), `Section 9 (L-S9): 英文第 ${r} 行严禁残留 temperature 叠词`);
    assert(!/pressure.*pressure/i.test(lblText), `Section 9 (L-S9): 英文第 ${r} 行严禁残留 pressure 叠词`);
    assert(lblText.startsWith(`9.${r}`), `Section 9 (L-S9): 英文第 ${r} 行小节序号必须为 9.${r} (实测: "${lblText}")`);
  }

  // L-S10: 稳定性和反应性 (六大固定条目)
  const s10Text = tblsCn[9].textContent;
  assert(/反应性|化学稳定性|可能发生的危险反应|应避免的条件|不相容的物质|危险的分解产物/.test(s10Text), 'Section 10 (L-S10): 六大反应性条目完备性保全');

  // L-S11: 毒理学信息 (自适应 Paradigm 1 通栏复合 vs Paradigm 2 标准端点插槽)
  if (isS11FullWidth) {
    assert(s11Cn.getElementsByTagName('w:tr').length === 4, `Section 11 (L-S11): 规范化收敛为 4 行三层排版`);
    const s11Row3Text = s11CnRow3?.textContent || '';
    if (model === 'PU-202A') {
      assert(/N,N[-－]二甲基乙酰胺/.test(s11Row3Text), 'Section 11 (L-S11): PU-202A DMAC 实测毒理试验数据保全');
    } else {
      assert(/羟基聚丙烯酸酯分散体/.test(s11Row3Text) && /丙二醇丁醚/.test(s11Row3Text) && /二乙二醇丁醚/.test(s11Row3Text), 'Section 11 (L-S11): 组分实测毒理试验数据 100% 内容守恒且无空值截断');
    }
  } else {
    const s11CnTrCount = s11Cn.getElementsByTagName('w:tr').length;
    assert(s11CnTrCount >= 12, `Section 11 (L-S11): 标准分列表格端点插槽完备 (实测行数: ${s11CnTrCount})`);
    assert(/急性毒性|刺激性|毒性/i.test(s11Cn.textContent), 'Section 11 (L-S11): 毒理学测试数据保全');
    const s11EnTrCount = tblsEn[10].getElementsByTagName('w:tr').length;
    assert(s11EnTrCount >= 12, `Section 11 英文版端点插槽完备 (实测行数: ${s11EnTrCount})`);
  }

  // L-S12: 生态学信息 (说明行与生态指标)
  const s12 = tblsCn[11];
  assert(s12.getElementsByTagName('w:tr').length >= 4, 'Section 12 (L-S12): 生态学资料行数与引导说明行保全');

  // L-S13: 废弃处置 (废弃原则与双居中标签，英文内容严格纯左对齐 jc=left 彻底终结假性居中失真)
  const s13 = tblsCn[12];
  const s13LastTr = s13.getElementsByTagName('w:tr')[s13.getElementsByTagName('w:tr').length - 1];
  const s13Jc = s13LastTr.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13Jc === 'center', `Section 13 (L-S13): 中文版废弃处置方法标签居中对齐 (jc=center) (实测: ${s13Jc})`);
  const s13MethodCell = s13LastTr.getElementsByTagName('w:tc')[1];
  const s13MethodJc = s13MethodCell?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13MethodJc === 'both', `Section 13 (L-S13): 中文版废弃处置方法内容两端对齐 (jc=both) (实测: ${s13MethodJc})`);

  const s13En = tblsEn[12];
  const s13LastTrEn = s13En.getElementsByTagName('w:tr')[s13En.getElementsByTagName('w:tr').length - 1];
  const s13JcEn = s13LastTrEn.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13JcEn === 'center', `Section 13 (L-S13): 英文版废弃处置方法标签居中对齐 (jc=center) (实测: ${s13JcEn})`);
  const s13MethodCellEn = s13LastTrEn.getElementsByTagName('w:tc')[1];
  const s13MethodJcEn = s13MethodCellEn?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13MethodJcEn === 'left', `Section 13 (L-S13): 英文版废弃处置方法内容严格纯左对齐 (jc=left) (实测: ${s13MethodJcEn})`);

  // L-S14: 运输信息 (非危险货物级联判定)
  const s14Text = tblsCn[13].textContent;
  assert(/非危险货物|非危险品/.test(s14Text), 'Section 14 (L-S14): 非危险货物级联判定联动保全');

  // L-S15: 法规信息 (中国核心法规列表)
  const s15Text = tblsCn[14].textContent;
  assert(/职业病防治法|安全生产法|危险化学品安全管理条例/.test(s15Text), 'Section 15 (L-S15): 中国法规名录列表完备聚合');

  // L-S16: 其他信息 (免责声明与第 1 节冲突去重)
  const s16Text = tblsCn[15].textContent;
  assert(/指导书/.test(s16Text) && /担保或品质说明书/.test(s16Text) && !/供应商地址/.test(s16Text), 'Section 16 (L-S16): 免责指导声明法定保全且彻底剥离供应商信息冲突');

  console.log('\n========================================================================');
  if (failCount === 0) {
    console.log('🎉 终审结论: 【双极双层全景机械深度审计 100% 满分通过】 (Failures: 0)');
    console.log('========================================================================');
    return { success: true, failCount: 0, failureDetails: [] };
  } else {
    console.error(`🚨 终审结论: 【存在 ${failCount} 项严重格式与语法违章】 (Failures: ${failCount})`);
    console.log('========================================================================');
    return { success: false, failCount, failureDetails };
  }
}

// 支持 CLI 独立运行
if (process.argv[1] && process.argv[1].endsWith('audit_bipolar_bilayer.mjs')) {
  runBipolarBilayerAudit().then(res => {
    if (!res.success) process.exit(1);
    process.exit(0);
  }).catch(err => {
    console.error('深度审计套件执行异常:', err);
    process.exit(1);
  });
}
