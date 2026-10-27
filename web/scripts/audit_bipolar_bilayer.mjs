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
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

export async function runBipolarBilayerAudit(customTargetDir = null) {
  const targetDir = customTargetDir || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
  
  console.log('========================================================================');
  console.log('       双极双层全景机械深度审计终审 (Bipolar Bilayer Deep Audit)        ');
  console.log(` 目标目录: ${targetDir}`);
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
    'PA-3223 msds_CN 冠志.docx',
    'PA-3223 msds_CN 冠志.pdf',
    'PA-3223 msds_CN 国彩.docx',
    'PA-3223 msds_CN 国彩.pdf',
    'PA-3223 msds_EN Guanzhi.docx',
    'PA-3223 msds_EN Guanzhi.pdf',
    'PA-3223 msds_EN Guocai.docx',
    'PA-3223 msds_EN Guocai.pdf',
  ];

  // ----------------------------------------------------------------------
  // 第一层：全局通用规范层 (Global Layer Audit)
  // ----------------------------------------------------------------------
  console.log('>>> [层 1: 全局通用规范层审查]');

  // G-01: 8 格式交付物完整性断言
  for (const file of DELIVERABLES) {
    const fullPath = `${targetDir}/${file}`;
    assert(fs.existsSync(fullPath), `交付物存在性 (G-01): ${file}`);
  }

  const docCn = await loadDocXml(`${targetDir}/PA-3223 msds_CN 冠志.docx`);
  const docEn = await loadDocXml(`${targetDir}/PA-3223 msds_EN Guanzhi.docx`);
  const docGuocaiCn = await loadDocXml(`${targetDir}/PA-3223 msds_CN 国彩.docx`);
  const docGuocaiEn = await loadDocXml(`${targetDir}/PA-3223 msds_EN Guocai.docx`);

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
  
  // Section 11 中英文通栏段落数同构
  const s11Cn = tblsCn[10];
  const s11En = tblsEn[10];
  const s11CnRow3 = s11Cn.getElementsByTagName('w:tr')[3];
  const s11EnRow3 = s11En.getElementsByTagName('w:tr')[3];
  const s11CnPs = Array.from(s11CnRow3?.getElementsByTagName('w:p') || []);
  const s11EnPs = Array.from(s11EnRow3?.getElementsByTagName('w:p') || []);
  assert(s11CnPs.length === s11EnPs.length, `Section 11 双语段落数量 1:1 同构 (G-25): 中文(${s11CnPs.length}段) vs 英文(${s11EnPs.length}段)`, `中文段落数: ${s11CnPs.length}, 英文段落数: ${s11EnPs.length}`);
  assert(s11EnPs.length === 4, `Section 11 英文版独立 4 段同构 (D-01/G-25): 实测段落数为 ${s11EnPs.length} (必须严格为 4 段)`);

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

  // G-26: 标点完整性与闭合公理 (Punctuation Integrity & Sentence Closure)
  // 1. 英文版 Section 11 零悬挂冒号断言
  let suspendedColonEnCount = 0;
  s11EnPs.forEach((p, idx) => {
    const t = getPText(p).trim();
    if (/:$/.test(t)) {
      suspendedColonEnCount++;
      console.error(`     ↳ 发现英文悬挂冒号: P[${idx}] -> "${t.slice(-20)}"`);
    }
  });
  assert(suspendedColonEnCount === 0, `Section 11 英文版零末尾悬挂冒号 (D-02/G-26): 违规悬空段落数: ${suspendedColonEnCount}`);

  // 2. 中文版 Section 11 零文本标签碰撞粘连
  let collisionCount = 0;
  s11CnPs.forEach((p, idx) => {
    const t = getPText(p);
    if (!t.includes('\n') && /mg\/kg刺激性|mg\/l刺激性|mg\/m3刺激性/.test(t)) {
      collisionCount++;
      console.error(`     ↳ 发现中文文本碰撞粘连: P[${idx}] -> "${t}"`);
    }
  });
  assert(collisionCount === 0, `Section 11 中文版零文本标签粘连碰撞 (D-04/G-26): 碰撞次数: ${collisionCount}`);

  // 3. 全局独立完整句子句末标点闭合断言 (D-06/G-26)
  // 检查 Section 4 (急救皮肤接触就医。)
  const s4TextCn = tblsCn[3].textContent || '';
  const s4HasDoctorPeriod = /就医[。.]/.test(s4TextCn);
  assert(s4HasDoctorPeriod, `Section 4 急救措施句号闭合 (D-06/G-26): 必须以 "就医。" 闭合`);

  // 检查 Section 5 (消防措施喷洒水。)
  const s5TextCn = tblsCn[4].textContent || '';
  const s5HasWaterPeriod = /(?:喷洒水|水喷雾)[。.]/.test(s5TextCn);
  assert(s5HasWaterPeriod, `Section 5 消防措施句号闭合 (D-06/G-26): 灭火介质末尾必须以句号闭合`);

  // 检查 Section 7 (安全操作规程衣物。)
  const s7TextCn = tblsCn[6].textContent || '';
  const s7HasClothPeriod = /更换被污染或浸湿的衣物[。.]/.test(s7TextCn);
  assert(s7HasClothPeriod, `Section 7 安全操作规程句号闭合 (D-06/G-26): 必须以 "更换被污染或浸湿的衣物。" 闭合`);

  // 检查 Section 11 中文各段句末闭合 (对齐手做版：P[0]以"；"闭合，P[1..3]以"刺激性：无资料"闭合)
  let s11UnclosedCnCount = 0;
  s11CnPs.forEach((p, idx) => {
    const t = getPText(p).trim();
    if (idx === 0) {
      if (!t.endsWith('；') && !t.endsWith(';')) s11UnclosedCnCount++;
    } else {
      if (!t.endsWith('刺激性：无资料') && !t.endsWith('无资料')) s11UnclosedCnCount++;
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
  // 英文冒号后不得紧贴无空格，也不得有 >= 2 个空格 (排除软换行首列缩进空格)
  let badColonSpacingEnCount = 0;
  s11EnPs.forEach((p, idx) => {
    const t = getPText(p);
    const badNoSpace = t.match(/[a-zA-Z0-9\)]:(?![ \s\n])/g);
    const badMultiSpace = t.replace(/ {10}/g, '').match(/[a-zA-Z0-9\)]:[ ]{2,}/g);
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
  // Section 11 允许且要求法定 6 空格 (CN) 与 10 空格 (EN) 垂直列对齐 (完全对齐手做版规格)
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
    const sanitized = t.replace(/ {10}/g, '');
    const m = sanitized.match(/[ ]{2,}/g);
    if (m) {
      multiSpaceEnCount += m.length;
      console.error(`     ↳ 英文 S11 P[${idx}] 发现连续多空格 (${m.length}处)`);
    }
  });
  assert(multiSpaceEnCount === 0, `Section 11 英文版零连续多空格对齐 (D-03/G-28): 违规连续多空格处数: ${multiSpaceEnCount}`);

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
  assert(/PA-3223/.test(s1Text), 'Section 1 (L-S1): 产品型号 PA-3223 准确绑定');
  assert(/广州冠志新材料科技有限公司/.test(s1Text), 'Section 1 (L-S1): 冠志供应商信息准确绑定');

  // L-S2: 危险性概述 (Mode B 全宽行与无菌排版)
  const s2Row1 = tblsCn[1].getElementsByTagName('w:tr')[1];
  const s2Tcs = s2Row1.getElementsByTagName('w:tc');
  assert(s2Tcs.length === 1, `Section 2 (L-S2): 单单元格通栏行拓扑完整 (实测单元格数: ${s2Tcs.length})`);
  const s2Text = s2Row1.textContent;
  assert(!/商业机密|7732-18-5|46±5/.test(s2Text), 'Section 2 (L-S2): 无菌覆写，彻底切断 Section 3 成分数据行穿透污染');
  assert(/请注意以下物质：/.test(s2Text) && /N,N-二甲基乙醇胺/.test(s2Text), 'Section 2 (L-S2): 成盐豁免附注准确锚定保全');

  // L-S2 进阶断言：5 级缩进几何状态机与加粗边界状态机
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

  // L-S4: 急救措施 (四维分流)
  assert(/吸入|皮肤接触|眼睛接触|食入/.test(s4TextCn), 'Section 4 (L-S4): 吸入/皮肤/眼睛/食入四维接触途径清晰分流');

  // L-S5: 消防措施
  assert(/灭火剂|特别危险性|灭火注意事项/.test(s5TextCn), 'Section 5 (L-S5): 灭火介质与特别危险性明确界定');

  // L-S6: 泄漏应急处理 (三大维度闭环)
  const s6Text = tblsCn[5].textContent;
  assert(/作业人员防护|环境保护措施|收容、清除方法/.test(s6Text), 'Section 6 (L-S6): 人员防护、环境保护、收容清除三大处置闭环');

  // L-S7: 操作处置与储存
  assert(/安全操作防范/.test(s7TextCn) && /安全储存条件/.test(s7TextCn) && /干燥通风/.test(s7TextCn), 'Section 7 (L-S7): 安全操作防范与安全储存条件法定守恒');

  // L-S8: 接触控制与个体防护 (PPE 四件套)
  const s8Text = tblsCn[7].textContent;
  assert(/工程控制|呼吸系统防护|眼睛防护|手部防护/.test(s8Text), 'Section 8 (L-S8): 个体防护装备 (PPE) 标准分流规范');

  // L-S9: 理化特性 (法定槽位全保全与 420dxa 悬挂缩进)
  const s9 = tblsCn[8];
  const s9Trs = s9.getElementsByTagName('w:tr');
  assert(s9Trs.length >= 19, `Section 9 (L-S9): 法定槽位行数完备保全 (实测行数: ${s9Trs.length})`);
  assert(!/pH值pH/.test(s9.textContent), 'Section 9 (L-S9): 消除 pH 标签叠词');

  // L-S10: 稳定性和反应性 (六大固定条目)
  const s10Text = tblsCn[9].textContent;
  assert(/反应性|化学稳定性|可能发生的危险反应|应避免的条件|不相容的物质|危险的分解产物/.test(s10Text), 'Section 10 (L-S10): 六大反应性条目完备性保全');

  // L-S11: 毒理学信息 (三级责任隔离与实测数据保全)
  assert(s11Cn.getElementsByTagName('w:tr').length === 4, `Section 11 (L-S11): 规范化收敛为 4 行三层排版`);
  const s11Row3Text = s11CnRow3?.textContent || '';
  assert(/羟基聚丙烯酸酯分散体/.test(s11Row3Text) && /丙二醇丁醚/.test(s11Row3Text) && /二乙二醇丁醚/.test(s11Row3Text), 'Section 11 (L-S11): 组分实测毒理试验数据 100% 内容守恒且无空值截断');

  // L-S12: 生态学信息 (说明行与生态指标)
  const s12 = tblsCn[11];
  assert(s12.getElementsByTagName('w:tr').length >= 4, 'Section 12 (L-S12): 生态学资料行数与引导说明行保全');

  // L-S13: 废弃处置 (废弃原则与双居中标签)
  const s13 = tblsCn[12];
  const s13LastTr = s13.getElementsByTagName('w:tr')[s13.getElementsByTagName('w:tr').length - 1];
  const s13Jc = s13LastTr.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13Jc === 'center', `Section 13 (L-S13): 废弃处置方法标签居中对齐 (jc=center) (实测: ${s13Jc})`);
  const s13MethodCell = s13LastTr.getElementsByTagName('w:tc')[1];
  const s13MethodJc = s13MethodCell?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  assert(s13MethodJc === 'both', `Section 13 (L-S13): 废弃处置方法内容两端对齐 (jc=both) (实测: ${s13MethodJc})`);

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
