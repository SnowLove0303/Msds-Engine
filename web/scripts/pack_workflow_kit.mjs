import fs from 'fs';
import path from 'path';
import jszipModule from 'jszip';
const JSZip = jszipModule.default || jszipModule;

const repoRoot = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine';
const outputZip = 'd:/APP/AI app/Antigravity/会话/MSDS_Studio_7Phase_Workflow_Kit.zip';

const zip = new JSZip();

function addDirectoryToZip(dirPath, zipFolder) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'user_data' ||
      entry.name.startsWith('scratch_') ||
      entry.name.startsWith('user_exec_logs.db')
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      const subFolder = zipFolder.folder(entry.name);
      addDirectoryToZip(fullPath, subFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(entry.name, content);
    }
  }
}

// 1. 标准化流程
addDirectoryToZip(path.join(repoRoot, '标准化流程'), zip.folder('标准化流程'));

// 2. 根目录 package.json
if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
  zip.file('package.json', fs.readFileSync(path.join(repoRoot, 'package.json')));
}

// 3. web 目录
const webFolder = zip.folder('web');
if (fs.existsSync(path.join(repoRoot, 'web/package.json'))) {
  webFolder.file('package.json', fs.readFileSync(path.join(repoRoot, 'web/package.json')));
}
addDirectoryToZip(path.join(repoRoot, 'web/src'), webFolder.folder('src'));
addDirectoryToZip(path.join(repoRoot, 'web/scripts'), webFolder.folder('scripts'));

console.log('Generating ZIP...');
const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
fs.writeFileSync(outputZip, buf);
console.log(`Successfully generated ${outputZip} (${buf.length} bytes)`);
