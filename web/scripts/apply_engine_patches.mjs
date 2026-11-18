import fs from 'node:fs/promises';

async function patchSmartMatching() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js';
  let content = await fs.readFile(p, 'utf-8');

  // Patch decoupleSection11ToxicologyBlocks regexes to make [：:] optional
  const oldRegexBlock = `{ key: 'skin_corrosion', label: '11.2 主要皮肤刺激性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:主要皮肤刺激性|原发性皮肤刺激|皮肤刺激)[：:])/i },`;
  const newRegexBlock = `{ key: 'skin_corrosion', label: '11.2 主要皮肤刺激性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:主要皮肤刺激性|原发性皮肤刺激|皮肤刺激)[：:]?)/i },`;

  if (content.includes(oldRegexBlock)) {
    content = content.replace(oldRegexBlock, newRegexBlock);
    content = content.replace(
      `{ key: 'eye_damage', label: '11.3 主要粘膜刺激性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:主要粘膜刺激性|主要眼睛刺激性|原发性粘膜刺激|眼睛刺激)[：:])/i },`,
      `{ key: 'eye_damage', label: '11.3 主要粘膜刺激性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:主要粘膜刺激性|主要眼睛刺激性|原发性粘膜刺激|眼睛刺激)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'sensitization', label: '11.4 致敏性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致敏性|呼吸道或皮肤过敏|皮肤致敏性)[：:])/i },`,
      `{ key: 'sensitization', label: '11.4 致敏性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致敏性|呼吸道或皮肤过敏|皮肤致敏性)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'germ_mutagenicity', label: '11.5 致突变性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致突变性|生殖细胞突变性|测试种类：体外染色体畸变试验)[：:])/i },`,
      `{ key: 'germ_mutagenicity', label: '11.5 致突变性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致突变性|生殖细胞突变性|测试种类：体外染色体畸变试验)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'carcinogenicity', label: '11.6 致癌性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致癌性)[：:])/i },`,
      `{ key: 'carcinogenicity', label: '11.6 致癌性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:致癌性)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'reproductive_toxicity', label: '11.7 生殖毒性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:生殖毒性)[：:])/i },`,
      `{ key: 'reproductive_toxicity', label: '11.7 生殖毒性：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:生殖毒性)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'stot_single', label: '11.8 特异性靶器官系统毒性（一次接触/反复接触）：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:特异性靶器官系统毒性(?:（一次接触[\\/／]反复接触）)?|STOT评估-一次性接触)[：:])/i },`,
      `{ key: 'stot_single', label: '11.8 特异性靶器官系统毒性（一次接触/反复接触）：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:特异性靶器官系统毒性(?:（一次接触[\\/／]反复接触）)?|STOT评估-一次性接触)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'aspiration_hazard', label: '11.9 吸入危险：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:吸入危害|吸入危险)[：:])/i },`,
      `{ key: 'aspiration_hazard', label: '11.9 吸入危险：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:吸入危害|吸入危险)[：:]?)/i },`
    );
    content = content.replace(
      `{ key: 'additional_info', label: '11.10 附加信息：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:附加信息|其它信息|其他信息|CMR评估)[：:])/i },`,
      `{ key: 'additional_info', label: '11.10 附加信息：', re: /(?:^|\\n)\\s*(?:(?:11\\.\\d+\\s*)?(?:附加信息|其它信息|其他信息|CMR评估)[：:]?)/i },`
    );
    content = content.replace(
      `rawLabel: '11.1 急性毒性：',\n        rawValue: headNote.split('\\n')[0].trim(),`,
      `rawLabel: '说明行',\n        rawValue: headNote.split('\\n')[0].trim(),`
    );
    content = content.replace(
      `|吸入危害|吸入危险|附加信息|其它信息|其他信息|经口|吸入|经皮)[:：\\s]*)+/i, '').trim();`,
      `|吸入危害|吸入危险|附加信息|其它信息|其他信息|CMR评估|经口|吸入|经皮)[:：\\s]*)+/i, '').trim();`
    );
    await fs.writeFile(p, content, 'utf-8');
    console.log('✅ Successfully patched smart-matching.js');
  } else {
    console.log('⚠️ smart-matching.js already patched or regex not found');
  }
}

async function patchPipelineEngine() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(p, 'utf-8');

  // 1. Add component translations
  const oldComp = `else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';`;
  const newComp = `else if (/聚氨酯.*聚合物/i.test(cnName)) enName = 'Polyurethane polymer';
            else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';
            else if (/氢氧化钠/i.test(cnName)) enName = 'Sodium hydroxide';
            else if (/三乙胺/i.test(cnName)) enName = 'Triethylamine';`;

  if (content.includes(oldComp)) {
    content = content.replace(oldComp, newComp);
    console.log('✅ Added component translations in pipeline-engine.js');
  }

  // 2. Fix srcDerm fallback in buildBaseChineseEngine
  const oldSrcDerm = `const srcDerm = srcS11.rows.find(r => /经皮/i.test(r.cells.map(c => c.text).join(' ')));`;
  const newSrcDerm = `const srcDerm = srcS11.rows.find(r => r.cells.length > 1 && /经皮/i.test(r.cells[0]?.text || ''));`;
  if (content.includes(oldSrcDerm)) {
    content = content.replace(oldSrcDerm, newSrcDerm);
    console.log('✅ Fixed srcDerm fallback in pipeline-engine.js');
  }

  // 3. Add toxicology OECD translations to translateToxicologyValueToEnglish
  const oldToxTarget = `t = t.replace(/，/g, ',');`;
  const newToxTarget = `t = t.replace(/聚氨酯分散体/g, 'Polyurethane dispersion');
  t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*大鼠\\s*[:：]\\s*/gi, 'LD50 / Oral / Rat: ');
  t = t.replace(/方法\\s*[:：]\\s*OECD化学品测试指南\\s*(\\d+)/gi, 'Method: OECD Test Guideline $1');
  t = t.replace(/对类似产品(?:的)?(?:毒理学)?研究/g, 'Studies on a similar product');
  t = t.replace(/评估\\s*[:：]\\s*此物质或混合物无急性皮肤毒性/g, 'Assessment: The substance or mixture has no acute dermal toxicity');
  t = t.replace(/试验环境\\s*[:：]\\s*粉尘\\/烟雾/g, 'Test atmosphere: dust/mist');
  t = t.replace(/评估\\s*[:：]\\s*此物质或混合物无急性呼吸毒性/g, 'Assessment: The substance or mixture has no acute inhalation toxicity');
  t = t.replace(/分类\\s*[:：]\\s*无皮肤刺激/g, 'Classification: No skin irritation');
  t = t.replace(/分类\\s*[:：]\\s*无眼睛刺激/g, 'Classification: No eye irritation');
  t = t.replace(/根据Buehler\\s*[（(]经皮试验[）)]\\s*皮肤致敏性\\s*[:：]/g, 'Buehler Test (dermal):');
  t = t.replace(/皮肤致敏性\\s*[（(]局部淋巴结试验\\s*[（(]LLNA[）)][）)]/g, 'Local lymph node assay (LLNA):');
  t = t.replace(/分类\\s*[:：]\\s*不引起皮肤过敏/g, 'Classification: Did not cause skin sensitization');
  t = t.replace(/结果\\s*[:：]\\s*阴性/g, 'Result: Negative');
  t = t.replace(/测试种类\\s*[:：]\\s*沙门氏菌\\/微粒体试验\\s*[（(]Ames试验[）)]/gi, 'Test type: Salmonella/microsome test (Ames test)');
  t = t.replace(/测试种类\\s*[:：]\\s*体外染色体畸变试验/g, 'Test type: In vitro mammalian chromosome aberration test');
  t = t.replace(/代谢活化\\s*[:：]\\s*有\\/无/g, 'Metabolic activation: with/without');
  t = t.replace(/体内基因毒性/g, 'In vivo genotoxicity:');
  t = t.replace(/STOT评估-一次性接触/g, 'STOT evaluation - single exposure:');
  t = t.replace(/基于现有数据，未满足分类标准。?/g, 'Based on available data, the classification criteria are not met.');
  t = t.replace(/STOT评估-重复性接触/g, 'STOT evaluation - repeated exposure:');
  t = t.replace(/CMR评估/g, 'CMR assessment:');
  t = t.replace(/亚急性[，, ]*亚慢性和延迟毒性/g, 'Subacute, subchronic and prolonged toxicity:');
  t = t.replace(/生殖毒性\\/生育力/g, 'Reproductive toxicity / fertility:');
  t = t.replace(/生殖毒性\\/致畸形/g, 'Reproductive toxicity / teratogenicity:');
  t = t.replace(/致癌性/g, 'Carcinogenicity:');
  t = t.replace(/吸入危害/g, 'Aspiration hazard:');
  t = t.replace(/致突变性/g, 'Mutagenicity:');
  t = t.replace(/，/g, ',');`;

  if (content.includes(oldToxTarget)) {
    content = content.replace(oldToxTarget, newToxTarget);
    console.log('✅ Added toxicology OECD translations in pipeline-engine.js');
  }

  await fs.writeFile(p, content, 'utf-8');
}

async function main() {
  await patchSmartMatching();
  await patchPipelineEngine();
  console.log('Done patching.');
}

main().catch(err => console.error(err));
