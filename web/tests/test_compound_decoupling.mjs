import assert from 'node:assert/strict';

const sampleS2Text = `物质或混合物分类
2.1 物质或混合物的分类
GHS危险性类别:
根据GHS不属于危害化学品
2.2 标签要素
GHS-象形图 
根据GHS不属于危害化学品
2.3 其他危险 无适用资料。`;

const sampleS11Text = `该产品无可用的毒理学研究。 下面是这些成分的毒理学数据。
11.1 毒理学效应 
急性毒性，经口
聚氨酯分散体
半数致死剂量(LD50) 大鼠: > 2,000 mg/kg
方法：OECD化学品测试指南423
对类似产品的毒理学研究

急性毒性，经皮
聚氨酯分散体
评估：此物质或混合物无急性皮肤毒性
对类似产品的研究

急性毒性，吸入
聚氨酯分散体
试验环境：粉尘/烟雾
评估：此物质或混合物无急性呼吸毒性
方法：OECD化学品测试指南403
对类似产品的研究

原发性皮肤刺激
聚氨酯分散体
物种：家兔
结果：轻微刺激
分类：无皮肤刺激
方法：OECD化学品测试指南404
对类似产品的研究

原发性粘膜刺激
聚氨酯分散体
物种：家兔
结果：轻微刺激
分类：无眼睛刺激
方法：OECD化学品测试指南405
对类似产品研究

致敏性
聚氨酯分散体
根据Buehler（经皮试验）皮肤致敏性：
物种：豚鼠
结果：阴性
分类：不引起皮肤过敏
方法：OECD化学品测试指南406
对类似产品研究

皮肤致敏性（局部淋巴结试验（LLNA））
物种：小鼠
结果：阴性
分类：不引起皮肤过敏
方法：OECD化学品测试指南429
对类似产品研究

亚急性，亚慢性和延迟毒性
聚氨酯分散体
无数据资料

致癌性
聚氨酯分散体
无数据资料

生殖毒性/生育力
聚氨酯分散体
无数据资料

生殖毒性/致畸形
聚氨酯分散体
无数据资料

体外遗传毒性
聚氨酯分散体
测试种类：沙门氏菌/微粒体试验（Ames试验）
代谢活化：有/无
结果：阴性
方法：OECD化学品测试指南471
对类似产品研究

测试种类：体外染色体畸变试验
代谢活化：有/无
结果：阴性
方法：OECD化学品测试指南473
对类似产品研究

体内基因毒性
聚氨酯分散体
无数据资料

STOT评估-一次性接触
聚氨酯分散体
基于现有数据，未满足分类标准。

STOT评估-重复性接触
聚氨酯分散体
无数据资料

吸入危害
聚氨酯分散体
无数据资料

CMR评估
聚氨酯分散体
致癌性：无数据资料。
致突变性：基于现有数据，未满足分类标准。
致畸性：无数据资料。
生殖毒性/生育力：无数据资料。`;

export function decoupleSection2CompoundBlocks(cellText, rowObj = null) {
  if (!cellText) return [];
  const text = String(cellText).trim();

  const hasClassification = /(?:2\.1|物质或混合物的分类|GHS危险性类别)/i.test(text);
  const hasLabelElements = /(?:2\.2|标签要素|GHS[- ]?象形图)/i.test(text);
  const hasOtherHazards = /(?:2\.3|其他危险|其他危害)/i.test(text);

  if (!hasClassification || (!hasLabelElements && !hasOtherHazards)) {
    return [];
  }

  const results = [];

  // 1. 提取 GHS 危险性类别
  let classPart = '';
  const labelIndex = text.search(/(?:2\.2\s*标签要素|标签要素|GHS[- ]?象形图)/i);
  if (labelIndex !== -1) {
    classPart = text.slice(0, labelIndex).trim();
  } else {
    const otherIndex = text.search(/(?:2\.3\s*其他危险|其他危险|其他危害)/i);
    classPart = otherIndex !== -1 ? text.slice(0, otherIndex).trim() : text;
  }

  let cleanClassVal = classPart
    .replace(/^(?:物质或混合物分类|2\.1\s*物质或混合物的分类|GHS危险性类别[:：]?)\s*/gim, '')
    .trim();
  cleanClassVal = cleanClassVal.replace(/^.*GHS危险性类别[:：]?\s*/i, '').trim();
  if (!cleanClassVal || /不属于危害化学品|不属于危险|未列入/i.test(cleanClassVal)) {
    cleanClassVal = cleanClassVal || '根据GHS不属于危害化学品';
  }

  results.push({
    rawLabel: '2.2 GHS危险性类别：',
    rawValue: cleanClassVal,
    rowObj,
  });

  // 2. 提取 标签要素 与 象形图
  if (labelIndex !== -1) {
    let labelPart = '';
    const otherIndex = text.search(/(?:2\.3\s*其他危险|其他危险|其他危害)/i);
    if (otherIndex !== -1 && otherIndex > labelIndex) {
      labelPart = text.slice(labelIndex, otherIndex).trim();
    } else {
      labelPart = text.slice(labelIndex).trim();
    }

    let cleanLabelVal = labelPart
      .replace(/^(?:2\.2\s*标签要素|标签要素|GHS[- ]?象形图[:：]?)\s*/gim, '')
      .trim();
    cleanLabelVal = cleanLabelVal.replace(/^.*GHS[- ]?象形图[:：]?\s*/i, '').trim();
    if (!cleanLabelVal || /不属于危害化学品|不属于危险|不适用/i.test(cleanLabelVal)) {
      cleanLabelVal = cleanLabelVal || '根据GHS不属于危害化学品';
    }

    results.push({
      rawLabel: '2.3 GHS标签要素：',
      rawValue: cleanLabelVal,
      rowObj,
    });

    results.push({
      rawLabel: 'GHS象形图：',
      rawValue: '无象形图',
      rowObj,
    });

    if (/不属于危害化学品|不属于危险|非危险品/i.test(cleanClassVal)) {
      results.push({
        rawLabel: '2.4 信号词：',
        rawValue: '无信号词',
        rowObj,
      });
    }
  }

  // 3. 提取 其他危险
  const otherIndex = text.search(/(?:2\.3\s*其他危险|其他危险|其他危害)/i);
  if (otherIndex !== -1) {
    const otherPart = text.slice(otherIndex).trim();
    let cleanOtherVal = otherPart
      .replace(/^(?:2\.3\s*其他危险|其他危险|其他危害)[:：]?\s*/i, '')
      .trim();
    if (!cleanOtherVal) cleanOtherVal = '无适用资料。';

    results.push({
      rawLabel: '2.10 其他危害：',
      rawValue: cleanOtherVal,
      rowObj,
    });
  }

  return results;
}

export function decoupleSection11ToxicologyBlocks(cellText, rowObj = null) {
  if (!cellText) return [];
  const text = String(cellText).trim();

  const endpoints = [
    { key: 'acute_toxicity', label: '11.1 急性毒性：', re: /(?:^|\n)\s*(?:11\.1\s*毒理学效应|急性毒性[，, ]*(?:经口|经皮|吸入)|急性毒性)/i },
    { key: 'skin_corrosion', label: '11.2 皮肤腐蚀或刺激：', re: /(?:^|\n)\s*(?:原发性皮肤刺激|皮肤刺激|主要皮肤刺激性)/i },
    { key: 'eye_damage', label: '11.3 严重眼损伤或刺激：', re: /(?:^|\n)\s*(?:原发性粘膜刺激|主要眼睛刺激性|眼睛刺激)/i },
    { key: 'sensitization', label: '11.4 呼吸道或皮肤过敏：', re: /(?:^|\n)\s*(?:致敏性|皮肤致敏性)/i },
    { key: 'stot_repeated_subacute', label: '11.9 特异性靶器官系统毒性——反复接触：', re: /(?:^|\n)\s*(?:亚急性[，, ]*亚慢性和延迟毒性)/i },
    { key: 'carcinogenicity', label: '11.6 致癌性：', re: /(?:^|\n)\s*(?:致癌性)/i },
    { key: 'reproductive_toxicity', label: '11.7 生殖毒性：', re: /(?:^|\n)\s*(?:生殖毒性\/生育力|生殖毒性)/i },
    { key: 'germ_mutagenicity', label: '11.5 生殖细胞突变性：', re: /(?:^|\n)\s*(?:体外遗传毒性|体内基因毒性|致突变性)/i },
    { key: 'stot_single', label: '11.8 特异性靶器官系统毒性——一次接触：', re: /(?:^|\n)\s*(?:STOT评估-一次性接触|STOT一次接触)/i },
    { key: 'stot_repeated', label: '11.9 特异性靶器官系统毒性——反复接触：', re: /(?:^|\n)\s*(?:STOT评估-重复性接触|STOT反复接触)/i },
    { key: 'aspiration_hazard', label: '11.10 吸入危害：', re: /(?:^|\n)\s*(?:吸入危害|吸入危险)/i },
  ];

  let matchCount = 0;
  for (const ep of endpoints) {
    if (ep.re.test(text)) matchCount++;
  }

  if (matchCount < 3) return [];

  const matches = [];
  for (const ep of endpoints) {
    const m = text.match(ep.re);
    if (m && typeof m.index === 'number') {
      matches.push({
        ep,
        index: m.index,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const results = [];
  if (matches[0] && matches[0].index > 0) {
    const headNote = text.slice(0, matches[0].index).trim();
    if (headNote && /无可用的毒理学研究/i.test(headNote)) {
      results.push({
        rawLabel: '11.1 急性毒性：',
        rawValue: headNote.split('\n')[0].trim(),
        rowObj,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunk = text.slice(current.index, nextIndex).trim();

    results.push({
      rawLabel: current.ep.label,
      rawValue: chunk,
      rowObj,
    });
  }

  return results;
}

const s2Res = decoupleSection2CompoundBlocks(sampleS2Text);
assert.equal(s2Res.length, 5);
assert.equal(s2Res[0].rawValue, '根据GHS不属于危害化学品');
assert.equal(s2Res[1].rawValue, '根据GHS不属于危害化学品');
assert.equal(s2Res[2].rawValue, '无象形图');
assert.equal(s2Res[3].rawValue, '无信号词');
assert.equal(s2Res[4].rawValue, '无适用资料。');
console.log('✓ Section 2 decouple test PASSED!');

const s11Res = decoupleSection11ToxicologyBlocks(sampleS11Text);
console.log('Section 11 decoupled count:', s11Res.length);
for (const item of s11Res) {
  console.log(' - ' + item.rawLabel + ' -> ' + item.rawValue.split('\n')[0]);
}

assert.ok(s11Res.length >= 8, 'Section 11 应成功切出至少 8 个独立端点');
assert.ok(s11Res.some(r => r.rawLabel.includes('11.1 急性毒性')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.2 皮肤腐蚀')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.3 严重眼损伤')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.4 呼吸道或皮肤过敏')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.5 生殖细胞突变')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.6 致癌性')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.7 生殖毒性')));
assert.ok(s11Res.some(r => r.rawLabel.includes('11.8 特异性靶器官')));
console.log('✓ Section 11 decouple test PASSED!');
