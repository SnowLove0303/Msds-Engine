import fs from 'fs';
import JSZip from 'jszip';

async function auditDeliverables() {
  const dir = 'D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A';
  const cnGuanzhi = dir + '/PU-202A msds_CN 冠志.docx';
  const enGuanzhi = dir + '/PU-202A msds_EN Guanzhi.docx';
  
  const zipCn = await JSZip.loadAsync(fs.readFileSync(cnGuanzhi));
  const xmlCn = await zipCn.file('word/document.xml').async('text');
  
  const zipEn = await JSZip.loadAsync(fs.readFileSync(enGuanzhi));
  const xmlEn = await zipEn.file('word/document.xml').async('text');

  console.log('================ 1. 验证 9.22 固体含量格式 ================');
  const match922 = xmlCn.match(/<w:tr[^>]*>[\s\S]*?固体含量[\s\S]*?<\/w:tr>/i);
  if (match922) {
    const row = match922[0];
    const ind = row.match(/<w:ind[^>]*\/>/);
    const tab = row.match(/<w:tabs>[\s\S]*?<\/w:tabs>/);
    const runs = row.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || [];
    console.log('9.22 缩进:', ind ? ind[0] : 'None');
    console.log('9.22 制表位:', tab ? tab[0] : 'None');
    runs.slice(0, 3).forEach((r, idx) => {
      const t = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/) || [])[1];
      const szMatch = r.match(/<w:sz w:val="([^"]+)"\/>/);
      const fontMatch = r.match(/<w:rFonts[^>]*\/>/);
      console.log(`Run ${idx}: text="${t}", sz=${szMatch ? szMatch[1] : 'default'}, font=${fontMatch ? fontMatch[0] : 'default'}`);
    });
  }

  console.log('\n================ 2. 验证 Section 11 (生殖毒性与附加信息) ================');
  const s11Match = xmlCn.match(/<w:tbl[\s\S]*?11\.1[\s\S]*?<\/w:tbl>/);
  if (s11Match) {
    const rows = s11Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const tcs = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const txts = tcs.map(tc => (tc.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(''));
      if (txts.some(t => t.includes('生殖') || t.includes('附加') || t.includes('11.7') || t.includes('11.9'))) {
        console.log(`Row ${idx} [cellCount=${tcs.length}]: ${JSON.stringify(txts)}`);
      }
    });
  }

  console.log('\n================ 3. 验证 Section 12 说明行 ================');
  const tablesCn = xmlCn.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const s12Cn = tablesCn.find(t => t.includes('生态信息'));
  if (s12Cn) {
    console.log('--- 中文 Section 12 行列表 ---');
    const rows = s12Cn.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const txt = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${txt}`);
    });
  }
  const tablesEn = xmlEn.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const s12En = tablesEn.find(t => t.includes('Ecotoxicity') || t.includes('Ecological'));
  if (s12En) {
    console.log('--- 英文 Section 12 行列表 ---');
    const rows = s12En.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const txt = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${txt}`);
    });
  }

  console.log('\n================ 4. 验证 页尾修订日期自适应提取 ================');
  for (const f of ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']) {
    const file = zipCn.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`[CN ${f}]: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }
  for (const f of ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']) {
    const file = zipEn.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`[EN ${f}]: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }
}

auditDeliverables().catch(console.error);
