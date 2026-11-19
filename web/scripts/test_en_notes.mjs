function translateSection3Notes(notesText) {
  if (!notesText || typeof notesText !== 'string') return '';
  const lines = notesText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const enLines = lines.map(line => {
    if (/羟基丙烯酸酯聚合物.*GHS危险性分类[：:\s]*不适用/i.test(line)) {
      return 'Hydroxyacrylate polymer GHS hazard classification: Not applicable.';
    }
    if (/请注意以下物质/i.test(line)) {
      return 'Please note the following substances:';
    }
    if (/N,N[-－]?二甲基乙醇胺.*中和剂.*盐.*浓度/i.test(line)) {
      return line
        .replace(/N,N[-－]?二甲基乙醇胺/g, 'N,N-Dimethylethanolamine')
        .replace(/，中和剂/g, ', neutralizer')
        .replace(/，已键合为盐/g, ', bonded as salt')
        .replace(/，质量浓度/g, ', mass concentration ')
        .replace(/小于/g, '< ')
        .replace(/大于/g, '> ');
    }
    if (/GHS分类[：:\s]*/i.test(line)) {
      return line
        .replace(/GHS分类[：:\s]*/i, 'GHS Classification: ')
        .replace(/依然液体|易燃液体/g, 'Flammable liquid ')
        .replace(/急性毒性/g, 'Acute toxicity ')
        .replace(/吸入性|吸入/g, 'Inhalation ')
        .replace(/经皮/g, 'Dermal ')
        .replace(/经口/g, 'Oral ')
        .replace(/皮肤腐蚀/g, 'Skin corrosion ')
        .replace(/皮肤刺激/g, 'Skin irritation ')
        .replace(/严重眼睛损伤|眼睛刺激/g, 'Eye damage/irritation ')
        .replace(/特异性靶器官系统毒性（一次接触）/g, 'STOT SE ')
        .replace(/特异性靶器官系统毒性（反复接触）/g, 'STOT RE ')
        .replace(/特异性靶器官毒性（一次接触）/g, 'STOT SE ')
        .replace(/特异性靶器官毒性（反复接触）/g, 'STOT RE ')
        .replace(/；/g, '; ');
    }
    if (/特定(?:阈值|浓度|极限)?浓度/i.test(line)) {
      return line.replace(/特定(?:阈值|浓度|极限)?浓度[：:\s]*/i, 'Specific concentration limit: ');
    }
    if (/特异性靶器官系统毒性（一次接触）/i.test(line)) {
      return line.replace(/特异性靶器官系统毒性（一次接触）/g, 'Specific target organ toxicity (single exposure) ');
    }
    return line;
  });
  return enLines.join('\n');
}

const note = `羟基丙烯酸酯聚合物GHS危险性分类：不适用
请注意以下物质：
N,N-二甲基乙醇胺，中和剂，已键合为盐，质量浓度小于1.0%
GHS分类：依然液体3 H226；急性毒性4 吸入性 H332；急性毒性4 经皮H312；皮肤腐蚀1B H314；特异性靶器官系统毒性（一次接触）3 H335
特定阈值浓度≥5%
特异性靶器官系统毒性（一次接触）3 H335`;

console.log('--- EN TRANSLATION ---');
console.log(translateSection3Notes(note));
