import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const startMarker = '// 2. 若有 baseCnEngine，提取中文 Section 9 包含的物理量关键词白名单';
const endMarker = 'renumberRecord(s9, \'9\');';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const replacement = `// 2. 若有 baseCnEngine，提取中文 Section 9 包含的物理量关键词白名单
    if (baseCnEngine) {
      const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
      if (cnS9) {
        const cnIndicators = cnS9.rows.map(r => (r.cells[0]?.text || '').trim());
        const hasPh = cnIndicators.some(t => /pH/i.test(t));
        const hasBoiling = cnIndicators.some(t => /沸点/i.test(t));
        const hasFlash = cnIndicators.some(t => /闪点/i.test(t));
        const hasEvap = cnIndicators.some(t => /蒸发速率/i.test(t));
        const hasFlammability = cnIndicators.some(t => /可燃性/i.test(t));
        const hasCombustion = cnIndicators.some(t => /燃烧值/i.test(t));
        const hasVapourDensity = cnIndicators.some(t => /相对蒸气密度/i.test(t));
        const hasDensity = cnIndicators.some(t => /(?:^|[\\s\\t])密度/i.test(t));
        const hasSolubility = cnIndicators.some(t => /水溶性/i.test(t));
        const hasIonicity = cnIndicators.some(t => /离子性/i.test(t));
        const hasSaturatedVapour = cnIndicators.some(t => /饱和蒸气压/i.test(t));
        const hasSurfaceTension = cnIndicators.some(t => /表面张力/i.test(t));
        const hasPartition = cnIndicators.some(t => /分配系数/i.test(t));
        const hasAutoIgnition = cnIndicators.some(t => /自燃温度/i.test(t));
        const hasIgnitionTemp = cnIndicators.some(t => /引燃温度/i.test(t));
        const hasDecompTemp = cnIndicators.some(t => /分解温度/i.test(t));
        const hasExplosive = cnIndicators.some(t => /爆炸特性|爆炸极限/i.test(t));
        const hasDustExplosion = cnIndicators.some(t => /粉尘爆炸/i.test(t));
        const hasSolids = cnIndicators.some(t => /固体含量|固含量/i.test(t));
        const hasViscosity = cnIndicators.some(t => /粘度|动力粘度/i.test(t));
        const hasOtherInfo = cnIndicators.some(t => /其他信息/i.test(t));

        // 倒序对中文不存在的未测死重行执行全量同构剪枝，确保中英文行数与槽位 100% 1:1 对齐
        for (let rIdx = s9.rows.length - 1; rIdx >= 1; rIdx--) {
          const rowText = (s9.rows[rIdx]?.cells[0]?.text || '').trim();
          let shouldPrune = false;
          if (!hasPh && /pH value/i.test(rowText)) shouldPrune = true;
          else if (!hasBoiling && /Initial boiling/i.test(rowText)) shouldPrune = true;
          else if (!hasFlash && /Flash point/i.test(rowText)) shouldPrune = true;
          else if (!hasEvap && /Evaporation rate/i.test(rowText)) shouldPrune = true;
          else if (!hasFlammability && /Flammability/i.test(rowText)) shouldPrune = true;
          else if (!hasCombustion && /Heat of combustion|Combustion/i.test(rowText)) shouldPrune = true;
          else if (!hasVapourDensity && /Relative vapour/i.test(rowText)) shouldPrune = true;
          else if (!hasDensity && /(?:^|\\s)Density/i.test(rowText)) shouldPrune = true;
          else if (!hasSolubility && /Solubility in water/i.test(rowText)) shouldPrune = true;
          else if (!hasIonicity && /Ionicity/i.test(rowText)) shouldPrune = true;
          else if (!hasSaturatedVapour && /Saturated vapour/i.test(rowText)) shouldPrune = true;
          else if (!hasSurfaceTension && /Surface tension/i.test(rowText)) shouldPrune = true;
          else if (!hasPartition && /log Pow|Partition/i.test(rowText)) shouldPrune = true;
          else if (!hasAutoIgnition && /Auto-ignition/i.test(rowText)) shouldPrune = true;
          else if (!hasIgnitionTemp && /Ignition temp/i.test(rowText)) shouldPrune = true;
          else if (!hasDecompTemp && /Decomposition/i.test(rowText)) shouldPrune = true;
          else if (!hasExplosive && /Explosive properties/i.test(rowText)) shouldPrune = true;
          else if (!hasDustExplosion && /Dust explosion/i.test(rowText)) shouldPrune = true;
          else if (!hasSolids && /Solid(?:s)?\\s*content/i.test(rowText)) shouldPrune = true;
          else if (!hasViscosity && /Dynamic viscosity/i.test(rowText)) shouldPrune = true;
          else if (!hasOtherInfo && /Other information/i.test(rowText)) shouldPrune = true;

          if (shouldPrune) {
            s9 = deleteRow(engine, s9, rIdx);
          }
        }
      }
    }

    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号
    `;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
console.log('✓ Section 9 pruning updated');

// Update Section 11 repRowInCn
const s11Marker = 'else if (/Reproductive toxicity/i.test(rText) && !repCn) shouldPrune = true;';
const s11Replacement = `const repRowInCn = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
        const stotRowInCn = cnS11?.rows?.some(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
        if (/Reproductive toxicity/i.test(rText) && !repCn && !repRowInCn) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !stotCn && !stotRowInCn) shouldPrune = true;`;

content = content.replace(s11Marker, s11Replacement);
console.log('✓ Section 11 pruning updated');

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js', content, 'utf8');
console.log('Successfully written proposed_pipeline_engine.js');
