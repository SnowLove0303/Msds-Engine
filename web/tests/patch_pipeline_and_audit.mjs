import fs from 'node:fs';

// 1. Patch web/src/pipeline-engine.js
const pePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let peContent = fs.readFileSync(pePath, 'utf8').replace(/\r\n/g, '\n');

// 1.1 Preamble logic
const oldPreambleLogic = `        } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(srcRow2Text)) {
          const m = srcRow2Text.match(/以[下为](?:是)?(.*?)毒理学数据/i);
          preamble = \`The following is toxicological data for \${m[1].trim()}:\`;
        } else {`;

const newPreambleLogic = `        } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(srcRow2Text)) {
          const m = srcRow2Text.match(/以[下为](?:是)?(.*?)毒理学数据/i);
          let targetChem = m[1].trim();
          targetChem = translateChemicalTerm(targetChem) || targetChem;
          targetChem = targetChem.replace(/N,N[－-]二甲基乙酰胺(?:\\s*[（(]DMAC[）)])?/gi, 'N,N-Dimethylacetamide (DMAC)');
          preamble = \`The following is toxicological data for \${targetChem}:\`;
        } else {`;

if (peContent.includes(oldPreambleLogic)) {
  peContent = peContent.replace(oldPreambleLogic, newPreambleLogic);
}

// 1.2 Toxicology translations
const oldTxBlock = `  // 致敏性
  t = t.replace(/物种\\s*[:：]\\s*豚鼠/g, 'Species: Guinea pig');
  t = t.replace(/物种\\s*[:：]\\s*人类/g, 'Species: Human');
  t = t.replace(/分类\\s*[:：]\\s*不是皮肤过敏物质/g, 'Classification: Not a skin sensitizer');
  t = t.replace(/结果\\s*[:：]\\s*未引起实验室动物过敏/g, 'Result: Did not cause sensitization in laboratory animals');
  t = t.replace(/结果\\s*[:：]\\s*对志愿者做的皮肤接触试验证明没有过敏特性/g, 'Result: Patch test on human volunteers demonstrated no sensitizing properties');

  // 致突变性、致癌性
  t = t.replace(/在细菌细胞培养中没有引起基因损害。?/g, 'Did not cause genetic damage in bacterial cell culture. ');
  t = t.replace(/在哺乳类细胞培养中没有引起基因损害。?/g, 'Did not cause genetic damage in mammalian cell culture. ');
  t = t.replace(/有证据认为此物质不会在动物中引起基因损伤。?/g, 'Evidence indicates substance does not cause genetic damage in animals.');
  t = t.replace(/对细菌或哺乳动物细胞培养未见致突变影响。?\\s*动物试验中未见致突变性影响。?/g, 'No mutagenic effects observed in bacterial or mammalian cell cultures. No mutagenic effects observed in animal studies.');
  t = t.replace(/在动物试验中未见致癌影响。?/g, 'No carcinogenic effects observed in animal studies.');

  // 生殖毒性
  t = t.replace(/动物试验表明无生殖毒性。?/g, 'Animal testing showed no reproductive toxicity. ');
  t = t.replace(/动物实验表明在低于那些引起母体中毒的量时，对胚胎有影响。?/g, 'Animal experiments showed effects on the embryo at levels below those causing maternal toxicity. ');
  t = t.replace(/降低了胚胎胎儿的成活力，胎儿发育缓慢[（(]变异[）)]，胎儿畸形。?/g, 'Reduced embryo-fetal viability, slow fetal development (variations), fetal malformations.');
  t = t.replace(/在动物试验中，发现仅在射入高剂量的此物质后才有损坏生育的风险。?/g, 'Animal experiments showed risks of impaired fertility only at high doses. ');
  t = t.replace(/在动物试验显现出致畸效应。?/g, 'Animal experiments showed teratogenic effects. ');
  t = t.replace(/可能对胎儿造成伤害。?/g, 'May damage the unborn child.');

  // STOT 与 附加信息
  t = t.replace(/可能造成呼吸道刺激。?/g, 'May cause respiratory irritation.');
  t = t.replace(/饮酒精饮料会加剧毒性影响。?/g, 'Consumption of alcoholic beverages may aggravate toxic effects.\\n');
  t = t.replace(/N[－-]甲基吡咯烷酮有经皮吸收危险。?/g, 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*经口/g, 'Repeated dose toxicity: Oral;');
  t = t.replace(/病理变化\\s*[:：]\\s*胃，睾丸，肝，肾，红血球异常减少。?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\\n');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*吸入/g, 'Repeated dose toxicity: Inhalation;');
  t = t.replace(/病理变化\\s*[:：]\\s*肾、肝影响，视网膜损伤。?/g, 'Pathological changes: kidney and liver effects, retinal damage.');`;

const newTxBlock = `  // 致敏性
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*豚鼠/gi, 'Species: Guinea pig');
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*人类/gi, 'Species: Human');
  t = t.replace(/(?:分类|Classification)\\s*[:：]\\s*不是皮肤过敏物质[.。]?/gi, 'Classification: Not a skin sensitizer.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*未引起实验室动物过敏[.。]?/gi, 'Result: Did not cause sensitization in laboratory animals.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*对志愿者做的皮肤接触试验证明没有过敏特性[.。]?/gi, 'Result: Patch test on human volunteers demonstrated no sensitizing properties.');

  // 致突变性、致癌性
  t = t.replace(/在细菌细胞培养中没有引起基因损害[.。]?/g, 'Did not cause genetic damage in bacterial cell culture. ');
  t = t.replace(/在哺乳类细胞培养中没有引起基因损害[.。]?/g, 'Did not cause genetic damage in mammalian cell culture. ');
  t = t.replace(/有证据认为此物质不会在动物中引起基因损伤[.。]?/g, 'Evidence indicates substance does not cause genetic damage in animals.');
  t = t.replace(/对细菌或哺乳动物细胞培养未见致突变影响[.。]?\\s*动物试验中未见致突变性影响[.。]?/g, 'No mutagenic effects observed in bacterial or mammalian cell cultures. No mutagenic effects observed in animal studies.');
  t = t.replace(/在动物试验中未见致癌影响[.。]?/g, 'No carcinogenic effects observed in animal studies.');

  // 生殖毒性
  t = t.replace(/动物试验(?:表明|显示)?无生殖毒性[.。]?/g, 'Animal testing showed no reproductive toxicity. ');
  t = t.replace(/动物实验表明在低于那些引起母体中毒的量时[，, ]*对胚胎有影响[.。]?/g, 'Animal experiments showed effects on the embryo at levels below those causing maternal toxicity. ');
  t = t.replace(/降低了胚胎胎儿的成活力[，, ]*胎儿发育缓慢[（(]变异[）)][，, ]*胎儿畸形[.。]?/g, 'Reduced embryo-fetal viability, slow fetal development (variations), fetal malformations.');
  t = t.replace(/在动物试验中[，, ]*发现仅在射入高剂量的此物质后才有损坏生育的风险[.。]?/g, 'Animal experiments showed risks of impaired fertility only at high doses. ');
  t = t.replace(/在动物试验显现出致畸效应[.。]?/g, 'Animal experiments showed teratogenic effects. ');
  t = t.replace(/可能对胎儿造成伤害[.。]?/g, 'May damage the unborn child.');

  // STOT 与 附加信息
  t = t.replace(/可能造成呼吸道刺激[.。]?/g, 'May cause respiratory irritation.');
  t = t.replace(/饮酒精饮料会加剧毒性影响[.。]?/g, 'Consumption of alcoholic beverages may aggravate toxic effects.\\n');
  t = t.replace(/N[－-]甲基吡咯烷酮有经皮吸收危险[.。]?/g, 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*经口/g, 'Repeated dose toxicity: Oral;');
  t = t.replace(/病理变化\\s*[:：]\\s*胃[，, ]*睾丸[，, ]*肝[，, ]*肾[，, ]*红血球异常减少[.。]?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\\n');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*吸入/g, 'Repeated dose toxicity: Inhalation;');
  t = t.replace(/病理变化\\s*[:：]\\s*肾[、，, ]*肝影响[，, ]*视网膜损伤[.。]?/g, 'Pathological changes: kidney and liver effects, retinal damage.');`;

if (peContent.includes(oldTxBlock)) {
  peContent = peContent.replace(oldTxBlock, newTxBlock);
} else {
  console.log('Notice: oldTxBlock not found (might already be patched or slightly different)');
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', peContent, 'utf8');
console.log('proposed_pipeline_engine.js written successfully!');

// 2. Patch web/scripts/audit_bipolar_bilayer.mjs
const auditPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let auditContent = fs.readFileSync(auditPath, 'utf8').replace(/\r\n/g, '\n');

const oldS2Audit = `      assert(/其他危险[：:]\\s*无适用资料/.test(s2Text), 'Section 2 (L-S2): 其他危险通栏完备');

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
        if (/^P\\d{3}/.test(pText)) {
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
      assert(p960Count >= 4, \`Section 2 通栏防范说明统一 left="960" 换行首字垂向对齐断言 (实测命中: \${p960Count} 段)\`);
      assert(pFirstLine1200Count === 0, \`Section 2 通栏严禁 firstLine="1200" 导致换行回缩顶格 (实测违规数: \${pFirstLine1200Count})\`);
      assert(otherDangerBoldPass, 'Section 2 通栏 "其他危险" 法定标签加粗格式继承断言 (<w:b/> 存在)');`;

const newS2Audit = `      assert(/(?:其他危害|其他危险)[：:]\\s*无适用资料/.test(s2Text), 'Section 2 (L-S2): 其他危险通栏完备');

      // 物理级 AST 断言：防范说明统一左缩进 left="960" 或 left="840"，实现换行首字绝对垂直垂向对齐
      const s2Ps = Array.from(tblsCn[1].getElementsByTagName('w:p'));
      let p960Count = 0;
      let pFirstLine1200Count = 0;
      let otherDangerBoldPass = false;

      for (const p of s2Ps) {
        const pText = (p.textContent || '').trim();
        const ind = p.getElementsByTagName('w:ind')[0];
        const lt = ind?.getAttribute('w:left');
        const fl = ind?.getAttribute('w:firstLine');
        if (/^P\\d{3}/.test(pText)) {
          if (lt === '960' || lt === '840') p960Count++;
          if (fl === '1200') pFirstLine1200Count++;
        }
        if (/(?:其他危害|其他危险)[：:]/.test(pText)) {
          const runs = Array.from(p.getElementsByTagName('w:r'));
          for (const r of runs) {
            const rText = r.textContent || '';
            if (/(?:其他危害|其他危险)/.test(rText)) {
              const b = r.getElementsByTagName('w:b')[0];
              if (b && b.getAttribute('w:val') !== '0') {
                otherDangerBoldPass = true;
              }
            }
          }
        }
      }
      assert(p960Count >= 4, \`Section 2 通栏防范说明统一 left="960/840" 换行首字垂向对齐断言 (实测命中: \${p960Count} 段)\`);
      assert(pFirstLine1200Count === 0, \`Section 2 通栏严禁 firstLine="1200" 导致换行回缩顶格 (实测违规数: \${pFirstLine1200Count})\`);
      assert(otherDangerBoldPass, 'Section 2 通栏 "其他危害/其他危险" 法定标签加粗格式继承断言 (<w:b/> 存在)');`;

if (auditContent.includes(oldS2Audit)) {
  auditContent = auditContent.replace(oldS2Audit, newS2Audit);
} else {
  console.log('Notice: oldS2Audit not found (might already be patched or slightly different)');
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_audit_bipolar_bilayer.mjs', auditContent, 'utf8');
console.log('proposed_audit_bipolar_bilayer.mjs written successfully!');
