import { harmonizeWithBenchmarkDatabase } from '../src/smart-matching.js';

const mockMatchResult = {
  fileNaming: { model: 'PA-3654' },
  matchedSections: [
    {
      sectionNumber: 1,
      matchedRows: [
        { key: 'model', value: 'PA-3654', status: 'MATCHED' },
        { key: 'product_name', value: '水性丙烯酸乳液', status: 'MATCHED' }
      ]
    },
    {
      sectionNumber: 8,
      matchedRows: [
        { key: 'respiratory_protection', standardLabel: '呼吸系统防护：', value: '配备呼吸防护设备', status: 'MATCHED' }
      ]
    },
    {
      sectionNumber: 13,
      matchedRows: [
        { key: 'waste_treatment_methods', standardLabel: '处置方法：', value: '尽可能倒空容器。', status: 'MATCHED' }
      ]
    },
    {
      sectionNumber: 15,
      matchedRows: []
    }
  ]
};

const harmonized = harmonizeWithBenchmarkDatabase(mockMatchResult, '02-1');

const s8 = harmonized.matchedSections.find(s => s.sectionNumber === 8);
console.log('S8 supplemented rows count:', s8.matchedRows.length);
const fkm = s8.matchedRows.find(r => r.key === 'ppe_gloves_fkm');
console.log('S8 FKM value:', fkm?.value);
console.log('S8 FKM source:', fkm?.source);

const s13 = harmonized.matchedSections.find(s => s.sectionNumber === 13);
const law = s13.matchedRows.find(r => r.key === 'waste_general_law');
console.log('S13 General Law value:', law?.value);

const s15 = harmonized.matchedSections.find(s => s.sectionNumber === 15);
console.log('S15 Regulations count:', s15.matchedRows.length);

if (fkm && fkm.source === 'BENCHMARK_DB' && law && s15.matchedRows.length === 4) {
  console.log('TASK 2 VERIFICATION PASSED (Exit Code 0)');
  process.exit(0);
} else {
  console.error('TASK 2 VERIFICATION FAILED');
  process.exit(1);
}
