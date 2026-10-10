import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/sec2_clean_dump.json', 'utf8'));

console.log('=== SECTION 2: 10-DIMENSION DEEP AUDIT MATRIX ===\n');

const issues = [];
for (const d of data) {
  const model = d.model;
  const rows = d.rows;
  
  const ghsRow = rows.find(r => r.key === 'ghs_classes' || r.key === 'ghs_classification');
  const pictoRow = rows.find(r => r.key === 'pictogram' || r.key === 'pictograms');
  const signalRow = rows.find(r => r.key === 'signal_word');
  const hazRow = rows.find(r => r.key === 'hazard_statements');
  const pRow = rows.find(r => r.key === 'precautionary_statements');
  const healthParent = rows.find(r => r.key === 'health_hazards');
  const healthInh = rows.find(r => r.key === 'health_hazard_inhalation');
  const healthSym = rows.find(r => r.key === 'health_hazard_symptoms');
  
  const modelIssues = [];
  
  // 1. GHS 分类是否有标签前缀残留 (如 GHS分类：)
  if (ghsRow && /GHS分类[:：]/i.test(ghsRow.value)) {
    modelIssues.push('GHS分类残留标签前缀"GHS分类："');
  }
  
  // 2. 象形图是否有文字泄漏 (如 "根据GHS不属于危害化学品")
  if (pictoRow && pictoRow.value && !pictoRow.hasDrawing && pictoRow.value !== '[象形图]') {
    modelIssues.push(`象形图单元格泄漏文字: "${pictoRow.value}"`);
  }
  
  // 3. 防范说明丢失 (P-statements dropped)
  if (hazRow && hazRow.value && (!pRow || !pRow.value || pRow.value.trim() === '')) {
    modelIssues.push('【严重】有危险性说明但防范说明(P代码)完全丢失为空！');
  }
  
  // 4. 健康危害合成幻觉 (吸入：正常使用时无危害。)
  if (healthInh && healthInh.value.includes('正常使用时无危害')) {
    const isToxic = ghsRow && (/急性毒性/i.test(ghsRow.value) || /H332/i.test(ghsRow.value) || /吸入/i.test(ghsRow.value));
    if (isToxic) {
      modelIssues.push('【严重矛盾/虚构】明明属于吸入毒性/H332，算法却硬编码虚构臆造出"吸入：正常使用时无危害。"！');
    } else {
      modelIssues.push('【虚构臆造】源文档未提及，算法硬编码虚构出"吸入：正常使用时无危害。"');
    }
  }
  
  // 5. 健康危害父子行重复
  if (healthParent && healthInh && healthParent.value && healthParent.value === healthInh.value) {
    modelIssues.push('2.8健康危害父行与吸入子行100%内容完全重复');
  }
  
  // 6. 症状和体征前缀重复
  if (healthSym && /^症状和体征[:：]/.test(healthSym.value)) {
    modelIssues.push('症状和体征单元格值中重复出现"症状和体征："标签前缀');
  }
  
  // 7. 空行率
  const emptyCount = rows.filter(r => !r.value || r.status === 'EMPTY').length;
  if (emptyCount >= 8) {
    modelIssues.push(`结构稀疏未剪枝收敛：全表共 16 行，其中 ${emptyCount} 行为空白行`);
  }
  
  issues.push({
    model,
    issuesCount: modelIssues.length,
    issues: modelIssues
  });
}

for (const it of issues) {
  console.log(`\n【${it.model}】(发现 ${it.issuesCount} 项缺陷)`);
  it.issues.forEach(iss => console.log(`  ❌ ${iss}`));
}

// 汇总统计
console.log('\n================ 全局缺陷分类汇总统计 ================');
const counter = {};
for (const it of issues) {
  for (const is of it.issues) {
    const key = is.split('：')[0].split('"')[0];
    counter[key] = (counter[key] || 0) + 1;
  }
}
console.table(counter);
