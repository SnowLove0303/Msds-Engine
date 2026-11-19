import fs from 'fs';

function inspectPdfHeader(name, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[NOT FOUND] ${filePath}`);
    return;
  }
  const buf = fs.readFileSync(filePath);
  const head = buf.slice(0, 2048).toString('latin1');
  const tail = buf.slice(-4096).toString('latin1');

  console.log(`\n============================================================`);
  console.log(`PDF: ${name} (${buf.length} bytes)`);
  console.log(`Path: ${filePath}`);

  // Find Producer and Creator
  const mProducer = head.match(/\/Producer\s*\(([^)]+)\)/) || tail.match(/\/Producer\s*\(([^)]+)\)/);
  const mCreator = head.match(/\/Creator\s*\(([^)]+)\)/) || tail.match(/\/Creator\s*\(([^)]+)\)/);
  const mCreationDate = head.match(/\/CreationDate\s*\(([^)]+)\)/) || tail.match(/\/CreationDate\s*\(([^)]+)\)/);

  console.log(`  Producer: ${mProducer ? mProducer[1] : 'Not found in sample'}`);
  console.log(`  Creator: ${mCreator ? mCreator[1] : 'Not found in sample'}`);
  console.log(`  CreationDate: ${mCreationDate ? mCreationDate[1] : 'Not found in sample'}`);
}

inspectPdfHeader(
  'PA-3654 (Current Pipeline LibreOffice)',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 msds_CN 冠志.pdf'
);

inspectPdfHeader(
  'PA-4914 (Python Hack Pipeline)',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.pdf'
);

inspectPdfHeader(
  'EP-1501 (Direct EP-1501 Folder)',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1501/EP-1501 msds_EN Guanzhi.pdf'
);

inspectPdfHeader(
  'EP-1501 (测试产出 Folder)',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1501/测试产出/EP-1501 msds_CN 冠志.pdf'
);
