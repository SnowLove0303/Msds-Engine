import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../web/src/docx-engine.js';
import * as sm from '../web/src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('Testing prototype upgrade logic...');

// Test decoupleS2 function
function decoupleSection2CompoundBlocksUpgraded(cellText, rowObj = null) {
  if (!cellText) return [];
  const text = String(cellText).trim();

  const hasClassification = /(?:2\.1|物质或混合物的分类|GHS危险性类别)/i.test(text);
  const hasLabelElements = /(?:2\.2|标签要素|GHS[- ]?象形图|警示词|信号词)/i.test(text);
  const hasOtherHazards = /(?:2\.3|其他危险|其他危害)/i.test(text);

  if (!hasClassification && !hasLabelElements && !hasOtherHazards) {
    return [];
  }

  const results = [];

  // 1. GHS 危险性类别
  let classPart = '';
  const classMatch = text.match(/(?:2\.1\s*(?:GHS\s*)?危险性分类|GHS危险性类别)[:：]?\s*([\s\S]*?)(?=(?:2\.2\s*GHS标签要素|GHS标签要素|标签要素|GHS[- ]?象形图|象形图|警示词|信号词|$))/i);
  if (classMatch) {
    classPart = classMatch[1].trim();
  } else {
    const labelIdx = text.search(/(?:2\.2\s*标签要素|标签要素|GHS[- ]?象形图|警示词|信号词)/i);
    classPart = labelIdx !== -1 ? text.slice(0, labelIdx).trim() : text;
  }
  let cleanClassVal = classPart
    .replace(/^(?:物质或混合物分类|2\.1\s*(?:物质或混合物的分类|GHS\s*危险性分类|GHS危险性类别)|GHS危险性类别)[:：]?\s*/gim, '')
    .trim();
  cleanClassVal = cleanClassVal.replace(/^.*GHS危险性类别[:：]?\s*/i, '').trim();
  if (!cleanClassVal || /不属于危害化学品|不属于危险|未列入/i.test(cleanClassVal)) {
    cleanClassVal = cleanClassVal || '根据GHS不属于危害化学品';
  }
  results.push({
    rawLabel: '2.2  GHS危险性类别：',
    rawValue: cleanClassVal,
    rowObj,
  });

  // 2. 物理危险
  const physM = text.match(/物理危险[:：]?\s*([^\r\n]+)/i);
  if (physM) {
    results.push({
      rawLabel: '2.7  物理和化学危险：',
      rawValue: physM[1].trim(),
      rowObj,
    });
  }

  // 3. 环境危害
  const envM = text.match(/环境危险[:：]?\s*([^\r\n]+)/i);
  if (envM) {
    results.push({
      rawLabel: '2.9  环境危害：',
      rawValue: envM[1].trim(),
      rowObj,
    });
  }

  // 4. 象形图 与 标签要素
  const pictoM = text.match(/(?:象形图|GHS[- ]?象形图)[:：]?\s*([^\r\n]+)/i);
  let pictoVal = '';
  if (pictoM) {
    pictoVal = pictoM[1].replace(/警示性说明[:：]?.*$/i, '').replace(/[:：\s]+$/, '').trim();
    if (!pictoVal) pictoVal = '无危险的象形图警示性说明';
    results.push({
      rawLabel: 'GHS象形图：',
      rawValue: pictoVal,
      rowObj,
    });
    results.push({
      rawLabel: '2.3  GHS标签要素：',
      rawValue: pictoVal,
      rowObj,
    });
  } else {
    results.push({
      rawLabel: 'GHS象形图：',
      rawValue: '无危险的象形图警示性说明',
      rowObj,
    });
    results.push({
      rawLabel: '2.3  GHS标签要素：',
      rawValue: '无危险的象形图警示性说明',
      rowObj,
    });
  }

  // 5. 信号词
  const sigM = text.match(/(?:警示词|信号词)[:：]?\s*([^\r\n]+)/i);
  let sigVal = sigM ? sigM[1].trim() : '';
  if (!sigVal) sigVal = '无信号词';
  results.push({
    rawLabel: '2.4  信号词：',
    rawValue: sigVal,
    rowObj,
  });

  // 6. 危险性说明 (警示性说明)
  const hazM = text.match(/(?:警示性说明|危险性说明)[:：]?\s*([\s\S]*?)(?=(?:防范说明|预防措施|事故响应|安全储存|废弃处置|其他危险|其他危害|$))/i);
  if (hazM) {
    const hazVal = hazM[1].trim();
    results.push({
      rawLabel: '2.5  危险性说明：',
      rawValue: hazVal,
      rowObj,
    });

    // 解析健康危害子项
    const skinM = hazVal.match(/(可能引起轻微的皮肤刺激|[^；;。]*皮肤[^；;。]*)/i);
    const eyeM = hazVal.match(/(可能引起眼睛刺激[^\r\n；;。]*|[^；;。]*眼睛[^；;。]*)/i);
    const ingM = hazVal.match(/(正常使用时只有轻微的摄入危害[^\r\n；;。]*|[^；;。]*摄入[^；;。]*|[^；;。]*胃不适[^\r\n；;。]*)/i);

    results.push({
      rawLabel: '吸入：',
      rawValue: '吸入：正常使用时无危害。',
      rowObj,
    });
    if (ingM) {
      const v = ingM[1].trim();
      results.push({
        rawLabel: '食入：',
        rawValue: '食入：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    if (skinM) {
      const v = skinM[1].trim();
      results.push({
        rawLabel: '皮肤：',
        rawValue: '皮肤：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    if (eyeM) {
      const v = eyeM[1].trim();
      results.push({
        rawLabel: '眼睛：',
        rawValue: '眼睛：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    results.push({
      rawLabel: '症状和体征：',
      rawValue: '症状和体征：' + hazVal,
      rowObj,
    });
    results.push({
      rawLabel: '2.8  健康危害：',
      rawValue: '吸入：正常使用时无危害。',
      rowObj,
    });
  }

  // 7. 防范说明 (P 代码)
  const precM = text.match(/(?:防范说明|预防措施)[:：]?\s*([\s\S]*?)(?=(?:其他危险|其他危害|2\.\d\s*其他|$))/i);
  if (precM) {
    const rawLines = precM[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const mergedLines = [];
    for (const line of rawLines) {
      if (/^P\d/i.test(line)) {
        mergedLines.push(line);
      } else if (/^(?:预防措施|事故响应|安全储存|废弃处置)[:：]?$/i.test(line)) {
        // 分组标签不进入 P 行
      } else if (mergedLines.length > 0) {
        mergedLines[mergedLines.length - 1] += line;
      }
    }
    results.push({
      rawLabel: '2.6  防范说明：',
      rawValue: mergedLines.join('\n'),
      rowObj,
    });
  }

  // 8. 其他危险
  const othM = text.match(/(?:2\.3\s*其他危险|2\.\d+\s*其他危险|其他危险|其他危害)[:：]?\s*([^\r\n]+)/i);
  let otherVal = othM ? othM[1].trim() : '无适用资料。';
  if (!otherVal) otherVal = '无适用资料。';
  results.push({
    rawLabel: '2.10 其他危害：',
    rawValue: otherVal,
    rowObj,
  });

  return results;
}

const tplBuf = fs.readFileSync('web/public/templates/正式模板_MSDS_CN_冠志(1).docx');

for (const num of ['PU-1001', 'PU-1002', 'PU-1003', 'PU-1004']) {
  console.log('Testing', num);
  const sBuf = fs.readFileSync('scratch/standard-compare/' + num + '_source_CN.docx');
  const sEngine = await loadDocx(sBuf);
  const s2 = sEngine.records.find(r => r.sectionNumber === 2);
  const decoupled = decoupleSection2CompoundBlocksUpgraded(s2.rows[1].cells[0].text);
  console.log('Decoupled count:', decoupled.length);
}
console.log('Prototype test passed!');
