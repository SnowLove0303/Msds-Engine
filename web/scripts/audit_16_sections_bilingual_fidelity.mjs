import fs from 'fs';
import path from 'path';
import zipfile from 'jszip';
import { JSDOM } from '../node_modules/jsdom/lib/api.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

/**
 * 16-Section 中英文逐句逐槽位 1:1 双向物理对账终极审计套件 (Universal 16-Section Bilingual Fidelity Auditor)
 * 严格执行：
 * 1. 1:1 Physical Slot Mapping Axiom (逐槽位/逐行绝对对齐)
 * 2. Zero Extraneous Template Fabrication Invariant (零模板外生虚构不变量)
 * 3. Multilingual Media Asset Purity Invariant (英文插图零中文光栅像素)
 * 4. Boundary & Margin Layout Safety Invariant (页眉页脚安全排版不变量)
 * 5. Statutory Modernity Evolution Axiom (现行有效法定法规演化公理)
 */
export async function audit16SectionsBilingualFidelity(cnDocxPath, enDocxPath, sourceDocxPath = null) {
  console.log('========================================================================');
  console.log('  16-Section 中英文逐句逐槽位 1:1 双向物理对账审计 (Bilingual Fidelity Auditor)');
  console.log(`  CN: ${path.basename(cnDocxPath)}`);
  console.log(`  EN: ${path.basename(enDocxPath)}`);
  console.log('========================================================================\n');

  const cnBuffer = fs.readFileSync(cnDocxPath);
  const enBuffer = fs.readFileSync(enDocxPath);

  const cnEngine = await loadDocx(cnBuffer);
  const enEngine = await loadDocx(enBuffer);

  const results = {
    totalAssertions: 0,
    passes: 0,
    failures: []
  };

  function assert(condition, message, details = '') {
    results.totalAssertions++;
    if (condition) {
      results.passes++;
      console.log(`✅ [PASS] ${message}`);
    } else {
      results.failures.push({ message, details });
      console.error(`❌ [FAIL] ${message} | 详情: ${details}`);
    }
  }

  // --- 0. 媒体资产纯度断言 (Media Asset Purity) ---
  const enZip = await zipfile.loadAsync(enBuffer);
  let enImageNames = [];
  enZip.forEach((relPath) => {
    if (relPath.startsWith('word/media/') && !relPath.endsWith('/')) enImageNames.push(relPath);
  });
  // 英文交付物中的 GHS 图标必须为纯正 png 资产，禁止复用带有中文位图的 jpeg (如 5493 bytes 带“警告”字样的 image1.jpeg)
  for (const imgName of enImageNames) {
    const data = await enZip.file(imgName).async('nodebuffer');
    assert(
      data.length !== 5493,
      `多语言媒体纯度: 英文交付物图片 ${imgName} 严禁直接复制中文模板的光栅位图 (5493 bytes)`,
      `实测尺寸: ${data.length} bytes`
    );
  }

  // --- 1. 页眉页脚安全几何断言 (Footer Margin Invariant) ---
  const footerXmls = Object.keys(enEngine.supportingXml || {}).filter(k => k.includes('footer'));
  for (const fKey of footerXmls) {
    const xml = enEngine.supportingXml[fKey];
    assert(
      !/w:firstLine="8730"/.test(xml),
      `页脚几何安全: ${fKey} 严禁包含畸形缩进 w:firstLine="8730" 导致 PDF 首字截断`,
      xml.slice(0, 300)
    );
  }

  // --- 2. 逐 Section 1:1 双语物理对账 ---
  for (let sNum = 1; sNum <= 16; sNum++) {
    const cnSec = cnEngine.records.find(r => r.sectionNumber === sNum);
    const enSec = enEngine.records.find(r => r.sectionNumber === sNum);

    assert(Boolean(cnSec), `Section ${sNum}: 中文母版中必须存在`);
    assert(Boolean(enSec), `Section ${sNum}: 英文交付物中必须存在`);
    if (!cnSec || !enSec) continue;

    switch (sNum) {
      case 1: {
        assert(enSec.rows.length >= 2, `Section 1: 英文交付物至少包含标题与基础信息行`);
        const cnText1 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const enText1 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        if (/涂料用添加剂/i.test(cnText1)) {
          assert(/Additive for coatings/i.test(enText1), `Section 1.2: 涂料用添加剂必须精准翻译为 Additive for coatings (严禁丢失“添加剂”定性)`);
        }
        break;
      }
      case 2: {
        const cnFull = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const enFull = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const isNonHaz = /不属于危害|非危险|不属于危险|危险性类别[：:]\s*无|not classified/i.test(cnFull);

        if (isNonHaz) {
          assert(!/H412|H315|Category|H332|H317/i.test(enFull), `Section 2: 中文非危险品，英文严禁残留旧模板危害分类与 H 声明`);
        } else {
          assert(/Classification of the substance/i.test(enFull), `Section 2.1: 英文危险分类标签必须完备`);
          assert(/GHS Label Elements/i.test(enFull), `Section 2.2: 英文 GHS 标签要素必须完备`);
          // 信号词对照
          if (/危险/.test(cnFull) && !/警告/.test(cnFull)) {
            assert(/Signal word:\s*Danger/i.test(enFull), `Section 2.2: 信号词必须翻译为 Danger`);
          } else if (/警告/.test(cnFull)) {
            assert(/Signal word:\s*Warning/i.test(enFull), `Section 2.2: 信号词必须翻译为 Warning`);
          }
        }
        if (!/2\.3/i.test(cnFull)) {
          assert(!/2\.3|Other hazards/i.test(enFull), `Section 2: 中文母版无 2.3 其他危险，英文严禁外生虚构 2.3 Other hazards`);
        }
        break;
      }
      case 3: {
        const cnBodyRows = cnSec.rows.slice(3);
        const enBodyRows = enSec.rows.slice(3);
        assert(cnBodyRows.length === enBodyRows.length, `Section 3: 成分表格成分行数必须完全 1:1 一致 (CN: ${cnBodyRows.length} vs EN: ${enBodyRows.length})`);
        // 28182-81-2 均聚物专业命名断言
        const enText3 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ');
        if (/28182-81-2/.test(enText3)) {
          assert(/Hexamethylene diisocyanate homopolymer/i.test(enText3), `Section 3: CAS 28182-81-2 必须专业翻译为 Hexamethylene diisocyanate homopolymer`);
        }
        break;
      }
      case 4: {
        const enText4 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ');
        assert(/Inhalation|Skin|Eye|Ingestion/i.test(enText4), `Section 4: 急救措施四大接触途径必须完备`);
        break;
      }
      case 5: {
        const enRows5 = enSec.rows.map(r => r.cells.map(c => c.text).join(' '));
        if (enRows5.length >= 3) {
          assert(enRows5[1] !== enRows5[2], `Section 5: 5.1 灭火剂与 5.2 不合适灭火剂绝不能相同`);
        }
        break;
      }
      case 6: {
        const enText6 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ');
        assert(/Personal precautions/i.test(enText6), `Section 6: 必须包含 6.1 Personal precautions`);
        assert(!/Suitable extinguishing media/i.test(enText6), `Section 6: 严禁残留底模错位的灭火标签`);
        break;
      }
      case 8: {
        assert(cnSec.rows.length === enSec.rows.length, `Section 8: 表格行数必须与中文严格同构 (CN: ${cnSec.rows.length} vs EN: ${enSec.rows.length})`);
        const cnText8 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const enText8 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        assert(!/建议戴上防护手套/i.test(cnText8), `Section 8: 手部防护严禁底模外生编造“建议戴上防护手套。”`);
        assert(!/Protective gloves are recommended/i.test(enText8), `Section 8: 手部防护严禁英文外生编造“Protective gloves are recommended.”`);
        if (/眼罩|面罩/.test(cnText8)) {
          assert(/Wear safety glasses\/face shield/i.test(enText8), `Section 8: 眼睛防护必须忠实翻译为“Wear safety glasses/face shield.”`);
        } else if (/建议使用护目镜/.test(cnText8)) {
          assert(/Protective goggles are recommended/i.test(enText8), `Section 8: 眼睛防护必须忠实翻译为“Protective goggles are recommended.”`);
          assert(!/Wear protective goggles or face shield/i.test(enText8), `Section 8: 眼睛防护严禁底模篡改编造“Wear protective goggles or face shield.”`);
        }
        // 关键门禁：严禁任何底模残留的未授权工程控制外生口水话
        assert(!/使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴设施/i.test(cnText8), `Section 8: 中文严禁底模外生编造工程控制口水话“使用局部排风或全面通风...”`);
        assert(!/Use local exhaust or general ventilation|eyewash and safety shower/i.test(enText8), `Section 8: 英文严禁外生编造工程控制口水话“Use local exhaust or general ventilation...”`);
        // 4列表格冒号与加粗反欺诈硬阻断
        const s8FourColRows = enSec.rows.filter(r => r.cells.length === 4);
        for (const r of s8FourColRows) {
          const c0Text = (r.cells[0]?.text || '').trim();
          assert(!/[:：]$/.test(c0Text), `Section 8: 4列表格 Col 0 严禁包含末尾冒号 (实测: "${c0Text}")`);
        }
        // 关键门禁：工程控制
        assert(/8\.2\s*工程控制/i.test(cnText8), `Section 8: 中文必须包含 8.2 工程控制`);
        assert(/8\.2\s*Engineering controls/i.test(enText8), `Section 8: 英文必须包含 8.2 Engineering controls`);

        const isNoOel = /无可用的接触限值|2006\/121|不含有职业接触限值|不含职业接触/i.test(cnText8);
        if (isNoOel) {
          // 无接触限值商品门禁：必须彻底剪除 4 列表格与题头，行数 <= 13 (实测 12 行)
          assert(cnSec.rows.length <= 13, `Section 8: 无接触限值时必须彻底剪枝四列表格 (实测行数: ${cnSec.rows.length})`);
          assert(!/工作场所组分控制参数/.test(cnText8), `Section 8: 无接触限值时严禁残留“工作场所组分控制参数”通栏题头`);
          assert(!/Control parameters for workplace components|Workplace component control parameters/i.test(enText8), `Section 8: 无接触限值时英文严禁残留控制参数题头`);
          assert(!/六亚甲基-1,6-二异氰酸酯/.test(cnText8), `Section 8: 无接触限值时严禁强塞“六亚甲基-1,6-二异氰酸酯”`);
          assert(!/Hexamethylene-1,6-diisocyanate/i.test(enText8), `Section 8: 无接触限值时英文严禁强塞“Hexamethylene-1,6-diisocyanate”`);
        } else {
          // 有接触限值商品门禁：四列表头与接触限值必须存在
          assert(cnSec.rows.length >= 14, `Section 8: 包含控制参数与工程控制时行数必须 >= 14 行 (实测: ${cnSec.rows.length})`);
          assert(/工作场所组分控制参数/.test(cnText8), `Section 8: 中文必须包含“工作场所组分控制参数”通栏题头`);
          assert(/Control parameters for workplace components|Workplace component control parameters/i.test(enText8), `Section 8: 英文必须包含工作场所组分控制参数题头`);
          assert(/物质.*依据.*类型.*数值/.test(cnText8.replace(/\s+/g, '')), `Section 8: 中文必须包含四列表头（物质|依据|类型|数值）`);
          assert(/(?:Substance|Components).*Basis.*Type.*Value/i.test(enText8.replace(/\s+/g, '')), `Section 8: 英文必须包含四列表头（Substance|Basis|Type|Value）`);
          // 动态 OEL 校验：有接触限值时必须包含具体受控组分或限值数值，严禁硬编码特定化学品
          assert(/(?:六亚甲基|丙二醇|二异氰酸酯|OEL|TWA|\d+\.?\d*\s*mg\/m3)/.test(cnText8), `Section 8: 中文有接触限值时必须包含具体受控组分及其接触限值数值`);
          assert(/(?:Hexamethylene|acetate|diisocyanate|OEL|TWA|\d+\.?\d*\s*mg\/m3)/i.test(enText8), `Section 8: 英文有接触限值时必须包含具体受控组分及其接触限值数值`);
        }
        break;
      }
      case 9: {
        // Section 9 核心对账：行数必须 1:1，序号必须 1:1，修饰语必须完整
        const cnItems = cnSec.rows.slice(1);
        const enItems = enSec.rows.slice(1);
        assert(cnItems.length === enItems.length, `Section 9: 理化特性行数必须 1:1 绝对对称 (CN: ${cnItems.length} vs EN: ${enItems.length})`);

        enItems.forEach((r, idx) => {
          const expectedNum = `9.${idx + 1}`;
          const cell0Text = r.cells[0]?.text || '';
          assert(cell0Text.startsWith(expectedNum), `Section 9.${idx + 1}: 英文小节编号必须严格递增为 ${expectedNum} (实测: "${cell0Text}")`);
          assert(!/(?:Flash point|Density|Dynamic viscosity)\s+(?:Flash point|Density|Dynamic viscosity)/i.test(cell0Text), `Section 9.${idx + 1}: 严禁出现标签叠词粘连 (实测: "${cell0Text}")`);
        });

        const enText9 = enItems.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const cnText9 = cnItems.map(r => r.cells.map(c => c.text).join(' ')).join('\n');

        if (/闭杯|闭口/.test(cnText9)) {
          assert(/Flash point \(closed cup\)/i.test(enText9), `Section 9.4: 闪点闭杯修饰语 (closed cup) 必须完整体现`);
        }
        if (/25\s*℃|25°C/.test(cnText9) && /粘度|动力粘度/.test(cnText9)) {
          assert(/Dynamic viscosity at 25 °C/i.test(enText9), `Section 9: 粘度温度修饰语 at 25 °C 必须完整体现`);
        }
        if (/25\s*℃|25°C/.test(cnText9) && /密度/.test(cnText9)) {
          assert(/Density at 25 °C/i.test(enText9), `Section 9: 密度温度修饰语 at 25 °C 必须完整体现`);
        }
        if (/固态.*气态|固体.*气体/.test(cnText9)) {
          assert(/Flammability \(solids, gases\)/i.test(enText9), `Section 9: 易燃性相态修饰语 (solids, gases) 必须完整体现`);
        }
        if (/分散.*乳化|乳化.*分散/.test(cnText9)) {
          assert(/Dispersible and emulsifiable in water/i.test(enText9), `Section 9: 水溶性必须精准体现 Dispersible and emulsifiable in water`);
        }
        if (/NCO/.test(cnText9)) {
          assert(/NCO content/i.test(enText9), `Section 9: NCO含量必须对齐翻译为 NCO content:`);
        }
        if (!/密度/.test(cnText9)) {
          assert(!/Density/i.test(enText9), `Section 9: 中文母版无密度，英文严禁外生硬塞 Density`);
        }
        break;
      }
      case 10: {
        const enText10 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const cnText10 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        if (/危险分解产物/.test(cnText10)) {
          assert(/Hazardous decomposition products:/i.test(enText10), `Section 10.2: 危险分解产物标签必须为 Hazardous decomposition products: (禁止误写为 Decomposition temperature:)`);
        }
        break;
      }
      case 11: {
        const enText11 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const cnText11 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        if (/主要粘膜刺激/.test(cnText11)) {
          assert(/Primary mucosal irritation:/i.test(enText11), `Section 11.3: 中文主要粘膜刺激性必须精准翻译为 Primary mucosal irritation: (禁止误写为 Primary eye irritation:)`);
        }
        break;
      }
      case 12: {
        const enText12 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        assert(!/water courses/i.test(enText12), `Section 12.1: 生态毒理排水禁止使用有语病的 water courses，必须使用 wastewater`);
        assert(/wastewater/i.test(enText12), `Section 12.1: 排水用语必须为 wastewater`);
        break;
      }
      case 13: {
        assert(cnSec.rows.length === enSec.rows.length, `Section 13: 中英文行数必须严格同构 (CN: ${cnSec.rows.length} vs EN: ${enSec.rows.length})`);
        assert(cnSec.rows.length === 4, `Section 13: 必须严格保持 4 行标准结构（标题 + 两行独立说明 + 处置方法）(实测 CN: ${cnSec.rows.length})`);
        break;
      }
      case 14: {
        const cnText14 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        const enText14 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        if (!/温度|food|acid|酸|碱/.test(cnText14)) {
          assert(!/Temperature must not exceed/i.test(enText14), `Section 14.4: 中文母版无温度限制，英文严禁外生虚构 Temperature must not exceed`);
          assert(!/Keep away from food/i.test(enText14), `Section 14.4: 中文母版无食品酸碱隔离要求，英文严禁外生虚构 Keep away from food`);
        }
        break;
      }
      case 15: {
        const enText15 = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        assert(!/Decree No\. 344/i.test(enText15), `Section 15: 法规时效性正向演进公理: 严禁引用已废止的国务院 344 号令`);
        assert(/Decree No\. 591/i.test(enText15), `Section 15: 法规时效性正向演进公理: 必须引用现行有效的国务院 591 号令`);
        assert(!/GB 20576/i.test(enText15), `Section 15: 法规时效性正向演进公理: 严禁引用已废止的 GB 20576 系列旧国标`);
        assert(/GB 30000/i.test(enText15), `Section 15: 法规时效性正向演进公理: 必须引用现行有效的 GB 30000 系列化学品分类国标`);
        const cnText15 = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
        if (!/15258|安全标签/i.test(cnText15)) {
          assert(!/15258|precautionary label/i.test(enText15), `Section 15: 中文母版未列 GB 15258，英文严禁外生强塞 GB 15258`);
        }
        break;
      }
    }
  }

  console.log('\n========================================================================');
  console.log(`  审计总结: 总断言 ${results.totalAssertions} 项 | 通过 ${results.passes} 项 | 失败 ${results.failures.length} 项`);
  console.log('========================================================================\n');

  if (results.failures.length > 0) {
    console.error('❌ 终审未通过，存在以下违规项:');
    results.failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.message}`);
      if (f.details) console.error(`     详情: ${f.details}`);
    });
    return { success: false, ...results };
  } else {
    console.log('🎉 16-Section 中英文逐句逐槽位 1:1 双向物理对账审计 100% 满分通过！');
    return { success: true, ...results };
  }
}

// CLI 执行入口
if (process.argv[1] && process.argv[1].endsWith('audit_16_sections_bilingual_fidelity.mjs')) {
  const cnPath = process.argv[2] || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const enPath = process.argv[3] || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

  audit16SectionsBilingualFidelity(cnPath, enPath).then(res => {
    process.exit(res.success ? 0 : 1);
  }).catch(err => {
    console.error('审计脚本运行时异常:', err);
    process.exit(1);
  });
}
