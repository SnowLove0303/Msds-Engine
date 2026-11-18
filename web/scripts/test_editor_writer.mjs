import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { writeDeliverableViaEditor } from '../src/editor-writer.js';

console.log('🧪 开始运行 editor-writer 单元测试...');

const mockContext = {
  modelCode: 'TEST-WRITER',
  productName: 'TEST-WRITER 水性聚合物',
  revisionDate: '2026/11/12',
  components: [
    { name: '测试聚合物', cas: 'Trade secret', conc: '40 %' },
    { name: '水', cas: '7732-18-5', conc: '60 %' }
  ],
  physicalProperties: [
    { label: '外观', value: '乳白色液体' },
    { label: '沸点', value: '100 °C' }
  ],
  transport: {
    road: '非危险品陆运输方式。',
    sea: '非危险品海运方式。',
    air: '非危险品运输方式。',
    precautions: '非危险货物。'
  }
};

const tmpOutput = path.resolve('output/test_editor_writer_cn.docx');
if (!fs.existsSync(path.dirname(tmpOutput))) {
  fs.mkdirSync(path.dirname(tmpOutput), { recursive: true });
}

const res = await writeDeliverableViaEditor({
  templateKey: 'CN_Guanzhi',
  contextData: mockContext,
  isEnglish: false,
  entityId: 'GUANZHI',
  outputPath: tmpOutput
});

assert.strictEqual(res.success, true);
assert.ok(fs.existsSync(tmpOutput), '输出文件必须存在');
const stat = fs.statSync(tmpOutput);
assert.ok(stat.size > 10000, `输出 DOCX 字节数 (${stat.size}) 必须大于 10KB`);

// 清理临时测试文件
fs.unlinkSync(tmpOutput);

console.log('🎉 所有 editor-writer 单元断言 100% 验证通过！');
