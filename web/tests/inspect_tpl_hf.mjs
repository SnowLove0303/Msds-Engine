import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const cnBuf = fs.readFileSync('web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const zipCn = await JSZip.loadAsync(cnBuf);
  console.log('=== CN Header ===');
  console.log(await zipCn.file('word/header1.xml')?.async('text'));
  console.log('=== CN Footer ===');
  console.log(await zipCn.file('word/footer1.xml')?.async('text'));

  const enBuf = fs.readFileSync('web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zipEn = await JSZip.loadAsync(enBuf);
  console.log('=== EN Header ===');
  console.log(await zipEn.file('word/header1.xml')?.async('text'));
  console.log('=== EN Footer ===');
  console.log(await zipEn.file('word/footer1.xml')?.async('text'));
}
main();
