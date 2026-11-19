# Design: EP-1501 六大双语细节瑕疵治理技术方案

## 1. 架构原则与实现落点
- **零底层篡改**：坚决不碰 `web/src/*`，所有修改集中在流水线脚本 `generate_ep1501_standard_deliverables.mjs` 中；
- **专属文本归正函数**：在脚本中实现 `refineEp1501BilingualTexts(eng, isEnglish)`，对引擎 DOM 进行精准的纯文本/节点替换，保持现有的 run 粗细与段落格式不变。

## 2. 详细替换逻辑
```javascript
function refineEp1501BilingualTexts(eng, isEnglish) {
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  if (!isEnglish) {
    // 1. S2 P273: "禁止排入环境" -> "避免释放到环境中"
    const s2 = eng.records.find(r => r.sectionNumber === 2);
    if (s2) {
      for (const row of s2.rows) {
        for (const p of (row.cells[0]?.paragraphs || [])) {
          if (p.text && p.text.includes('P273 禁止排入环境')) {
            replaceParagraphText(p, '禁止排入环境', '避免释放到环境中');
          }
        }
      }
    }
    // 2. S4.2 误服: "须就医" -> "须立即就医"
    const s4 = eng.records.find(r => r.sectionNumber === 4);
    if (s4 && s4.rows[2]) {
      replaceCellText(s4.rows[2].cells[0], '禁止催吐，须就医。', '禁止催吐，须立即就医。');
    }
    // 3. S8.2 2006/121/EG -> 2006/121/EC
    const s8 = eng.records.find(r => r.sectionNumber === 8);
    if (s8 && s8.rows[2]) {
      replaceCellText(s8.rows[2].cells[0], '2006/121/EG', '2006/121/EC');
    }
    // 6. S15 重复去重
    const s15 = eng.records.find(r => r.sectionNumber === 15);
    if (s15) {
      if (s15.rows[2]) replaceCellText(s15.rows[2].cells[0], '其它的规定：其它的规定：', '其它的规定：');
      if (s15.rows[3]) replaceCellText(s15.rows[3].cells[0], '符合下列法规要求：符合下列法规要求：', '符合下列法规要求：');
    }
  } else {
    // 4. S13 废弃处置英文补全
    const s13 = eng.records.find(r => r.sectionNumber === 13);
    if (s13 && s13.rows[1]) {
      const c = s13.rows[1].cells[0];
      if (c && !c.text.includes('Strictly comply')) {
        appendCellText(c, ' Strictly comply with national and local hazardous waste and environmental protection regulations.');
      }
    }
    // 5. S14 运输注意事项去重
    const s14 = eng.records.find(r => r.sectionNumber === 14);
    if (s14 && s14.rows[4]) {
      replaceCellText(s14.rows[4].cells[0], 
        'Temperature must not exceed +40°C and must not fall below 5°C. Temperature must not exceed +40°C and must not fall below +5°C.',
        'Temperature must not exceed +40°C and must not fall below +5°C.'
      );
    }
    // 6. S15 重复去重
    const s15 = eng.records.find(r => r.sectionNumber === 15);
    if (s15) {
      if (s15.rows[2]) replaceCellText(s15.rows[2].cells[0], 'Other provisions: Other provisions:', 'Other provisions:');
      if (s15.rows[3]) replaceCellText(s15.rows[3].cells[0], 'Complies with the following regulations: Complies with the following regulations:', 'Complies with the following regulations:');
    }
  }
}
```
