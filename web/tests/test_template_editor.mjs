import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  inspectTemplateSchema,
  createWorkSession,
  clearTemplateValues,
  writeCellValueToSession,
  formatSection9LaserTabs,
  saveSession
} from '../src/template-editor.js';

async function runTest() {
  console.log('=== Testing Template Editor ===');

  // 1. 检索模板格式
  const schema = await inspectTemplateSchema('CN_Guanzhi');
  console.log('Template schema inspected:', schema.name, 'Language:', schema.language);
  console.log('Sections in schema:', Object.keys(schema.sections).length);
  if (Object.keys(schema.sections).length < 16) {
    throw new Error('Template schema missing sections');
  }

  // 2. 创建独立工作会话
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-editor-test-'));
  const session = await createWorkSession('CN_Guanzhi', tempDir);
  console.log('Work session created:', session.sessionId);

  // 3. 清空模板占位值
  const clearRes = clearTemplateValues(session);
  console.log('Cleared sections:', clearRes.clearedSections.length);

  // 4. 原子写入值格
  const writeRes = writeCellValueToSession(session, {
    sectionNumber: 1,
    rowIndex: 2,
    cellIndex: 1,
    text: '测试水性聚氨酯分散体'
  });
  console.log('Write cell result:', writeRes);

  // 5. 注入 Section 9 激光垂线对齐
  const laserRes = formatSection9LaserTabs(session);
  console.log('Laser tabs formatted:', laserRes);

  // 6. 保存文档
  const testOut = path.join(tempDir, 'output_test.docx');
  const saveRes = await saveSession(session, testOut);
  console.log('Session saved:', saveRes.outputPath, 'Size:', saveRes.sizeBytes);

  if (!fs.existsSync(testOut) || fs.statSync(testOut).size < 10000) {
    throw new Error('Saved document is invalid or too small');
  }

  // 清理临时文件
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('🎉 Template Editor Test PASSED (Exit Code 0)');
}

runTest().catch(err => {
  console.error('❌ Template Editor Test FAILED:', err);
  process.exit(1);
});
