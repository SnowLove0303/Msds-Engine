import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/tri_dump_4840_4902.json', 'utf-8'));

function analyzeSectionOmissions(modelName, rec, srcParas, outParas) {
  console.log(`\n=================== ${modelName} FORENSIC ANALYSIS ===================`);
  
  // Section 1
  console.log(`\n--- [${modelName}] Section 1 (化学品分类 / 产品名称) ---`);
  console.log(`Rec Classification: ${rec.chemicalClassification}`);
  console.log(`Rec Product Name: ${rec.productName}`);
  const s1Out = outParas.filter(p => p.includes('化学品分类') || p.includes('化学品中文名') || p.includes('产品推荐用途'));
  console.log(`Out S1 snippet:`, s1Out);

  // Section 2
  console.log(`\n--- [${modelName}] Section 2 (危险性概述) ---`);
  console.log(`Rec isHazardous: ${rec.ghs.isHazardous}`);
  console.log(`Rec Categories:`, rec.ghs.categories);
  console.log(`Rec SignalWord: ${rec.ghs.signalWord}`);
  console.log(`Rec HazardStatements:`, rec.ghs.hazardStatements);
  console.log(`Rec Precautionary:`, {
    prev: rec.ghs.precautionaryStatements?.prevention?.length || 0,
    resp: rec.ghs.precautionaryStatements?.response?.length || 0,
    stor: rec.ghs.precautionaryStatements?.storage?.length || 0,
    disp: rec.ghs.precautionaryStatements?.disposal?.length || 0
  });
  console.log(`Rec OtherHazards:`, rec.ghs.otherHazards);
  const s2Out = outParas.filter(p => p.includes('2.1') || p.includes('2.2') || p.includes('2.3') || p.includes('2.4') || p.includes('防范说明') || p.includes('危险性类别'));
  console.log(`Out S2 snippet:`, s2Out.slice(0, 15));

  // Section 3
  console.log(`\n--- [${modelName}] Section 3 (成分/组成信息) ---`);
  console.log(`Rec Components (${rec.components?.length || 0}):`, rec.components?.map(c => `${c.name} | CAS:${c.casNumber} | Conc:${c.concentration}`));
  console.log(`Rec ComponentsNotes:`, rec.componentsNotes);
  const s3Out = outParas.filter(p => p.includes('3.1') || p.includes('3.2') || p.includes('中和剂') || p.includes('聚合物') || p.includes('丁氧基'));
  console.log(`Out S3 snippet:`, s3Out);

  // Section 9
  console.log(`\n--- [${modelName}] Section 9 (理化特性 - pH & 稀释比) ---`);
  const pHRec = rec.physicalProperties?.find(p => p.label.includes('pH') || p.sequence === 3);
  console.log(`Rec pH:`, pHRec ? `${pHRec.label}: ${pHRec.value}` : 'NOT_FOUND');
  const s9Out = outParas.filter(p => p.includes('9.3') || p.includes('pH') || p.includes('稀释'));
  console.log(`Out S9 snippet:`, s9Out);

  // Section 11
  console.log(`\n--- [${modelName}] Section 11 (毒理学信息) ---`);
  console.log(`Rec Toxicology (keys):`, Object.keys(rec.toxicology || {}));
  if (rec.toxicology?.clinicalAssessment) {
    console.log(`Rec Clinical Assessment length:`, rec.toxicology.clinicalAssessment.length);
  }
  const s11Out = outParas.filter(p => p.includes('11.1') || p.includes('急性毒性') || p.includes('LD50') || p.includes('OECD') || p.includes('刺激'));
  console.log(`Out S11 snippet (first 10):`, s11Out.slice(0, 10));
}

analyzeSectionOmissions('PA-4840', dump.rec4840, dump.tSrc4840, dump.tOut4840);
analyzeSectionOmissions('PA-4902', dump.rec4902, dump.tSrc4902, dump.tOut4902);
