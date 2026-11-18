import fs from 'fs';
let content = fs.readFileSync('./src/pipeline-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetProtect = `        // 法定保护行：特异性靶器官系统毒性、生殖毒性等即便为“无数据资料”亦属法定声明，严禁物理删除
        if (/特异性靶器官|生殖毒性/i.test(labelText)) {
          continue;
        }`;

const newProtect = `        // 法定保护行：特异性靶器官系统毒性、生殖毒性、附加信息等即便为“无数据资料”亦属法定声明，严禁物理删除
        if (/特异性靶器官|生殖毒性|附加信息/i.test(labelText)) {
          continue;
        }`;

if (!content.includes(targetProtect)) {
  console.log('targetProtect not found!');
  process.exit(1);
}

content = content.replace(targetProtect, newProtect);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('../scratch/pipeline-engine.proposed.js', content, 'utf8');
console.log('Successfully created ../scratch/pipeline-engine.proposed.js');
