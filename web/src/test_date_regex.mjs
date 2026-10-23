import fs from 'fs';
import JSZip from 'jszip';

async function test() {
  const p = 'D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 国彩_源文件留存.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const f1 = await zip.file('word/footer1.xml').async('text');
  
  // 原始逻辑：
  const m1 = f1.match(/(?:修订日期|生效日期|编制日期|发布日期|Revision Date|Date)[^<]{0,30}?(\d{4}\s*[年\/\-\.]\s*\d{1,2}\s*[月\/\-\.]\s*\d{1,2}\s*日?)/i)
    || f1.match(/(\d{4}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{1,2})/);
  console.log('Original regex result:', m1 ? m1[1] : null);

  // 纯文本提取逻辑：
  const plainText = f1.replace(/<[^>]+>/g, ' ');
  const m2 = plainText.match(/(?:修订日期|生效日期|编制日期|发布日期|Revision Date|Date)[^0-9]{0,30}?(\d{4}\s*[年\/\-\.]\s*\d{1,2}\s*[月\/\-\.]\s*\d{1,2}\s*日?)/i)
    || plainText.match(/(\d{4}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{1,2})/);
  console.log('Plain text regex result:', m2 ? m2[1] : null);
}

test();
