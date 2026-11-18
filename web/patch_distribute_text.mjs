import fs from 'node:fs/promises';

async function patch() {
  let content = await fs.readFile('src/docx-engine.js', 'utf8');

  const oldDistribute = `function distributeText(nodes, value) {
  if (!nodes.length) return;
  const clean = String(value ?? '').replace(/\\r\\n?/g, '\\r\\n');
  const weights = nodes.map((node) => Math.max((node.textContent || '').length, 1));
  const total = weights.reduce((sum, item) => sum + item, 0);
  let offset = 0;
  nodes.forEach((node, index) => {
    const end = index === nodes.length - 1 ? clean.length : offset + Math.round(clean.length * weights[index] / total);
    node.textContent = clean.slice(offset, end);
    if (/^\\s|\\s$/.test(node.textContent)) node.setAttribute('xml:space', 'preserve');
    offset = end;
  });
}`;

  const newDistribute = `function distributeSingleParagraphNodes(nodes, clean) {
  if (nodes.length === 1) {
    nodes[0].textContent = clean;
    if (/^\\s|\\s$/.test(clean)) nodes[0].setAttribute('xml:space', 'preserve');
    return;
  }

  // 尝试匹配序号与前缀结构（如 "2.2  GHS Label Elements："）
  const m = clean.match(/^(\\d+(?:\\.\\d+)*)(\\s+)(.*)$/);
  if (m && nodes.length >= 2) {
    nodes[0].textContent = m[1];
    nodes[nodes.length - 1].textContent = m[3];
    for (let i = 1; i < nodes.length - 1; i++) {
      nodes[i].textContent = i === 1 ? m[2] : '';
      if (/^\\s|\\s$/.test(nodes[i].textContent)) nodes[i].setAttribute('xml:space', 'preserve');
    }
    return;
  }

  // 严禁按字数比例在英文单词中间截断！完整写入主要首节点，清空其余节点
  nodes[0].textContent = clean;
  if (/^\\s|\\s$/.test(clean)) nodes[0].setAttribute('xml:space', 'preserve');
  for (let i = 1; i < nodes.length; i++) {
    nodes[i].textContent = '';
  }
}

/**
 * 语义分行感知与断词保护的文本分发 (Semantic Line-Break Aware Distribution)
 * 彻底杜绝盲目按字符比例在单词中间截断（如将 "Label" 截断为 "Lab" 和 "el"）
 */
function distributeText(nodes, value) {
  if (!nodes.length) return;
  const clean = String(value ?? '').replace(/\\r\\n?/g, '\\n');

  // 若传入显式换行
  const lines = clean.split('\\n');
  if (lines.length > 1) {
    nodes[0].textContent = lines[0];
    for (let i = 1; i < nodes.length; i++) {
      nodes[i].textContent = lines[i] || '';
    }
    return;
  }

  // 单行文本：检查 nodes 是否跨越了多个段落 (<w:p>)
  const paragraphs = new Set();
  const nodeParagraphMap = new Map();
  nodes.forEach((n) => {
    let p = n.parentNode;
    while (p && p.localName !== 'p') p = p.parentNode;
    if (p) {
      paragraphs.add(p);
      nodeParagraphMap.set(n, p);
    }
  });

  const pList = Array.from(paragraphs);
  if (pList.length > 1) {
    // 跨段落但文本为单行：将文本写入首个段落节点，清空后续段落并移除多余空段落
    const firstP = pList[0];
    const firstPNodes = nodes.filter((n) => nodeParagraphMap.get(n) === firstP);
    const otherPNodes = nodes.filter((n) => nodeParagraphMap.get(n) !== firstP);

    otherPNodes.forEach((n) => { n.textContent = ''; });
    for (let i = 1; i < pList.length; i++) {
      pList[i].parentNode?.removeChild(pList[i]);
    }

    distributeSingleParagraphNodes(firstPNodes, clean);
  } else {
    distributeSingleParagraphNodes(nodes, clean);
  }
}`;

  if (!content.includes(oldDistribute)) {
    throw new Error('oldDistribute not found in src/docx-engine.js');
  }

  content = content.replace(oldDistribute, newDistribute);
  await fs.writeFile('../scratch/docx-engine.distribute_fixed.js', content);
  console.log('Successfully generated scratch/docx-engine.distribute_fixed.js');
}

patch();
