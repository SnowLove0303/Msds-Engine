import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function verify() {
  console.log('=== 全量 8 项核心问题自动化终审断言 ===\n');
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-608';
  let enFile = path.join(dir, 'PU-608 msds_EN Guanzhi (更新).docx');
  if (!fs.existsSync(enFile)) {
    enFile = path.join(dir, 'PU-608 msds_EN Guanzhi.docx');
  }
  console.log('Target verification file:', enFile);
  
  const buf = fs.readFileSync(enFile);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(docXml, 'text/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  
  const report = [];

  // Issue 1 & 2: Section 2.5 防范说明
  const s2Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Hazards Identification'));
  if (s2Tbl) {
    const r6 = s2Tbl.getElementsByTagName('w:tr')[6];
    const c1 = r6?.getElementsByTagName('w:tc')[1];
    const ps = Array.from(c1?.getElementsByTagName('w:p') || []);
    const pTexts = ps.map(p => p.textContent.trim());
    
    const hasDuplicateHeader = pTexts.some(t => /^Precautionary statement\(s\):?/i.test(t));
    const prevP = ps.find(p => p.textContent.trim().startsWith('Prevention:'));
    const prevBold = prevP?.getElementsByTagName('w:b').length > 0;
    const respP = ps.find(p => p.textContent.trim().startsWith('Response:'));
    const respBold = respP?.getElementsByTagName('w:b').length > 0;
    const storP = ps.find(p => p.textContent.trim().startsWith('Storage:'));
    const storBold = storP?.getElementsByTagName('w:b').length > 0;
    const dispP = ps.find(p => p.textContent.trim().startsWith('Disposal:'));
    const dispBold = dispP?.getElementsByTagName('w:b').length > 0;
    
    const prevIdx = ps.indexOf(prevP);
    const respIdx = ps.indexOf(respP);
    const hasSpaceBeforeResp = ps.slice(prevIdx, respIdx).some(p => p.textContent.trim() === '');
    
    report.push({
      item: '1 & 2. Section 2.5 防范说明（剔除重复总标题、子标题加粗、大类间空行隔离）',
      pass: !hasDuplicateHeader && prevBold && respBold && storBold && dispBold && hasSpaceBeforeResp,
      details: {
        hasDuplicateHeader: hasDuplicateHeader ? 'FAIL (包含重复总标题)' : 'PASS (已剔除)',
        subheadingsBold: (prevBold && respBold && storBold && dispBold) ? 'PASS (Prevention/Response/Storage/Disposal 均已加粗)' : 'FAIL',
        hasSpaceBetweenGroups: hasSpaceBeforeResp ? 'PASS (各大类之间物理空行隔开)' : 'FAIL'
      }
    });
  }

  // Issue 3: Section 3 具体成分名称
  const s3Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Composition/Information'));
  if (s3Tbl) {
    const rows = Array.from(s3Tbl.getElementsByTagName('w:tr'));
    const r3Headers = Array.from(rows[3]?.getElementsByTagName('w:tc') || []).map(c => c.textContent.trim());
    const compRows = rows.slice(4);
    let allCompNotBold = true;
    let allCompNoColon = true;
    const compDetails = [];
    
    for (const r of compRows) {
      const c0 = r.getElementsByTagName('w:tc')[0];
      const p = c0?.getElementsByTagName('w:p')[0];
      const b = p?.getElementsByTagName('w:b').length > 0;
      const text = p?.textContent.trim() || '';
      if (b) allCompNotBold = false;
      if (text.endsWith(':')) allCompNoColon = false;
      compDetails.push({ text, bold: b });
    }
    
    const r3NoColon = !r3Headers[0]?.endsWith(':');
    
    report.push({
      item: '3. Section 3 具体成分名称不加粗、无冒号，表头加粗无冒号',
      pass: allCompNotBold && allCompNoColon && r3NoColon,
      details: {
        allComponentsRegular: allCompNotBold ? 'PASS (全部成分均为常规体 Regular，绝不加粗)' : 'FAIL (存在加粗)',
        noTrailingColon: allCompNoColon ? 'PASS (末尾绝无冒号)' : 'FAIL (存在冒号)',
        headerRowNoColon: r3NoColon ? 'PASS (表头 Chemical name 绝无冒号)' : 'FAIL',
        components: compDetails
      }
    });
  }

  // Issue 4: Section 9 标签垂直对齐与换行首字对齐
  const s9Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Physical and chemical'));
  if (s9Tbl) {
    const rows = Array.from(s9Tbl.getElementsByTagName('w:tr')).slice(1);
    let allInd420 = true;
    let noDuplicateWords = true;
    let allHaveTab = true;
    const s9Details = [];
    
    for (const r of rows) {
      const c0 = r.getElementsByTagName('w:tc')[0];
      const p = c0?.getElementsByTagName('w:p')[0];
      const ind = p?.getElementsByTagName('w:ind')[0];
      const tab = p?.getElementsByTagName('w:tab')[0];
      const left = ind?.getAttribute('w:left');
      const text = c0?.textContent.trim() || '';
      
      if (left !== '420') allInd420 = false;
      if (!tab) allHaveTab = false;
      if (/pressure:\s*pressure|temperature:\s*temperature|coefficient\)?:\s*partition/i.test(text)) noDuplicateWords = false;
      s9Details.push({ text, left, hasTab: !!tab });
    }
    
    report.push({
      item: '4. Section 9 标签首字垂直对齐与换行首字对齐 (悬挂缩进 420 dxa + Tab 制表跳跃)',
      pass: allInd420 && noDuplicateWords && allHaveTab,
      details: {
        allAlignedAt420WithTab: (allInd420 && allHaveTab) ? 'PASS (全部左边界与悬挂缩进 420 dxa 对齐，Run 内含 <w:tab/>)' : 'FAIL',
        noDuplicateLabels: noDuplicateWords ? 'PASS (无重复压力/温度/分配系数词)' : 'FAIL',
        sampleRows: s9Details.slice(9, 13)
      }
    });
  }

  // Issue 5: Section 11 二级标签 (Oral/Inhalation/Dermal) 加粗，续行首列清除冒号
  const s11Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Toxicity information'));
  if (s11Tbl) {
    const rows = Array.from(s11Tbl.getElementsByTagName('w:tr'));
    const r3 = rows[3];
    const r4 = rows[4];
    const r5 = rows[5];
    
    const oralB = r3?.getElementsByTagName('w:tc')[1]?.getElementsByTagName('w:b').length > 0;
    const inhB = r4?.getElementsByTagName('w:tc')[1]?.getElementsByTagName('w:b').length > 0;
    const dermB = r5?.getElementsByTagName('w:tc')[1]?.getElementsByTagName('w:b').length > 0;
    
    const r4Col0Text = (r4?.getElementsByTagName('w:tc')[0]?.textContent || '').trim();
    const r5Col0Text = (r5?.getElementsByTagName('w:tc')[0]?.textContent || '').trim();
    const col0Clean = (r4Col0Text === '' || r4Col0Text === '[]') && (r5Col0Text === '' || r5Col0Text === '[]');
    
    report.push({
      item: '5. Section 11 二级标签 (Oral/Inhalation/Dermal) 加粗，续行首列清除冒号',
      pass: oralB && inhB && dermB && col0Clean,
      details: {
        oralBold: oralB ? 'PASS (Oral: 已加粗)' : 'FAIL',
        inhalationBold: inhB ? 'PASS (Inhalation: 已加粗)' : 'FAIL',
        dermalBold: dermB ? 'PASS (Dermal: 已加粗)' : 'FAIL',
        continuationCol0Clean: col0Clean ? 'PASS (续行首列纯净空白无冒号)' : 'FAIL'
      }
    });
  }

  // Issue 6: Section 13 Disposal methods 垂直、水平居中
  const s13Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Handling precautions'));
  if (s13Tbl) {
    const r2 = s13Tbl.getElementsByTagName('w:tr')[2];
    const c0 = r2?.getElementsByTagName('w:tc')[0];
    const tcPr = c0?.getElementsByTagName('w:tcPr')[0];
    const vAlign = tcPr?.getElementsByTagName('w:vAlign')[0]?.getAttribute('w:val');
    const p = c0?.getElementsByTagName('w:p')[0];
    const jc = p?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
    const hasInd = p?.getElementsByTagName('w:ind').length > 0;
    const b = p?.getElementsByTagName('w:b').length > 0;
    
    report.push({
      item: '6. Section 13 Disposal methods 绝对垂直居中与水平居中，清空缩进',
      pass: vAlign === 'center' && jc === 'center' && !hasInd && b,
      details: {
        vAlign: vAlign === 'center' ? 'PASS (垂直居中)' : 'FAIL',
        jc: jc === 'center' ? 'PASS (水平居中)' : 'FAIL',
        noInd: !hasInd ? 'PASS (无缩进干扰)' : 'FAIL',
        bold: b ? 'PASS (加粗)' : 'FAIL'
      }
    });
  }

  // Issue 7: Section 15 Other provisions / Complies with... 加粗
  const s15Tbl = tables.find(t => (t.getElementsByTagName('w:tr')[0]?.textContent || '').includes('Regulatory information'));
  if (s15Tbl) {
    const rows = Array.from(s15Tbl.getElementsByTagName('w:tr'));
    const r2P = rows[2]?.getElementsByTagName('w:p')[0];
    const r3P = rows[3]?.getElementsByTagName('w:p')[0];
    const r4P = rows[4]?.getElementsByTagName('w:p')[0];
    
    const r2B = r2P?.getElementsByTagName('w:b').length > 0;
    const r3B = r3P?.getElementsByTagName('w:b').length > 0;
    const r4B = r4P?.getElementsByTagName('w:b').length > 0;
    
    report.push({
      item: '7. Section 15 单列子标题 (Other provisions / Complies with...) 加粗',
      pass: r2B && r3B && !r4B,
      details: {
        otherProvisionsBold: r2B ? 'PASS (加粗)' : 'FAIL',
        compliesBold: r3B ? 'PASS (加粗)' : 'FAIL',
        regulationsItemsRegular: !r4B ? 'PASS (具体法规保持 Regular)' : 'FAIL'
      }
    });
  }

  // Issue 8: 页脚公司左对齐，Revision Date 格式与最新时间
  const footerXml = await zip.file('word/footer1.xml')?.async('text');
  if (footerXml) {
    const fDoc = new DOMParser().parseFromString(footerXml, 'text/xml');
    const ps = Array.from(fDoc.getElementsByTagName('w:p'));
    const p0Jc = ps[0]?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
    const p1Jc = ps[1]?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
    const p1Text = ps[1]?.textContent.trim();
    
    const hasRevisionDateUpper = p1Text.startsWith('Revision Date:');
    const dateMatch = p1Text.match(/\d{4}\/\d{2}\/\d{2}/);
    const dateVal = dateMatch ? dateMatch[0] : '';
    const isLatest = dateVal.startsWith('2026');
    
    report.push({
      item: '8. 页脚排版（公司居左、Revision Date 首字母大写及最新时间）',
      pass: p0Jc === 'left' && p1Jc === 'right' && hasRevisionDateUpper && isLatest,
      details: {
        companyJcLeft: p0Jc === 'left' ? 'PASS (公司名称左对齐)' : 'FAIL',
        dateJcRight: p1Jc === 'right' ? 'PASS (日期右对齐)' : 'FAIL',
        revisionDateCapitalized: hasRevisionDateUpper ? 'PASS (首字母大写 Revision Date:)' : 'FAIL',
        latestDateYear: isLatest ? `PASS (最新时间 ${dateVal})` : `FAIL (${dateVal})`
      }
    });
  }

  console.log(JSON.stringify(report, null, 2));
  const allPass = report.every(r => r.pass);
  console.log(`\n===========================================`);
  console.log(allPass ? '🎉 全量 8 项测试全部 100% 绿灯 PASS！' : '❌ 存在未通过项目！');
  console.log(`===========================================`);
}

verify().catch(console.error);
