import assert from 'node:assert/strict';
import { buildStructuredContext2 } from '../src/context-governor.js';

function makeMockContext1WithS2(s2Lines) {
  return {
    sourceFile: 'mock.docx',
    sections: {
      1: { sectionNumber: 1, title: '1. 化学品及企业标识', rows: [{ rowIndex: 0, cells: [{ text: '1. 化学品及企业标识' }] }] },
      2: {
        sectionNumber: 2,
        title: '2. 危险性概述',
        rows: [
          { rowIndex: 0, cells: [{ text: '2. 危险性概述' }] },
          { rowIndex: 1, cells: [{ text: s2Lines.join('\n') }] }
        ]
      }
    }
  };
}

// 1. PURE_SOURCE_PRESERVATION 模式：不注入 2.1/2.2、不重排 2.0、不注入中文 P 组子标签
{
  const ctx1 = makeMockContext1WithS2([
    '2.0 紧急情况概述：液体。',
    '物质或混合物分类：易燃液体 类别3',
    'P210 远离热源。'
  ]);
  const ctx2 = buildStructuredContext2(ctx1, {
    rulePack: 'PURE_SOURCE_PRESERVATION',
    translations: {
      '2. 危险性概述': '2. Hazards Identification',
      '2.0 紧急情况概述：液体。': '2.0 Emergency overview: Liquid.',
      '物质或混合物分类：易燃液体 类别3': 'Classification: Flammable liquid Category 3',
      'P210 远离热源。': 'P210 Keep away from heat.'
    }
  });
  const s2Lines = ctx2.sections[2].items.find(i => i.role === 'FULL_WIDTH_STRUCTURED')?.lines || [];
  const texts = s2Lines.map(l => l.textCn);
  assert.ok(texts.some(t => t.startsWith('2.0 ')), '保真模式严禁重排 2.0');
  assert.ok(!texts.includes('2.1 物质或混合物的分类'), '保真模式严禁强行改写为 2.1');
  assert.ok(!texts.includes('2.2 标签要素'), '保真模式严禁外生注入 2.2');
  assert.ok(!texts.includes('预防措施：'), '保真模式严禁外生注入 P 组子标签');
  assert.equal(ctx2.sections[2].items.length > 0, true);
  assert.equal(Object.keys(ctx2.sections).length, 2, '动态章节模式不应强制补齐 16 个空节');
  console.log('✅ PASS: PURE_SOURCE_PRESERVATION 模式忠实保留原文层级与编号');
}

// 2. CN_GB_MSDS_DEFAULT 模式：保持既有国标规范（2.0 重排为 2.1，P2xx 注入 预防措施：）
{
  const ctx1 = makeMockContext1WithS2([
    '2.0 紧急情况概述：液体。',
    '物质或混合物的分类',
    'P210 远离热源。'
  ]);
  const ctx2 = buildStructuredContext2(ctx1, { rulePack: 'CN_GB_MSDS_DEFAULT' });
  const s2Lines = ctx2.sections[2].items.find(i => i.role === 'FULL_WIDTH_STRUCTURED')?.lines || [];
  const texts = s2Lines.map(l => l.textCn);
  assert.ok(texts.some(t => t.startsWith('2.1 ')), '国标默认模式应将 2.0 顺延为 2.1');
  assert.ok(texts.includes('预防措施：'), '国标默认模式应注入 P 组子标签');
  console.log('✅ PASS: CN_GB_MSDS_DEFAULT 模式保持 100% 向后兼容');
}

// 3. roleOverrides 测试：支持 Agent 显式标注行角色
{
  const ctx1 = makeMockContext1WithS2(['自定义无冒号题头', '自定义内容行']);
  const ctx2 = buildStructuredContext2(ctx1, {
    rulePack: 'PURE_SOURCE_PRESERVATION',
    roleOverrides: {
      '自定义无冒号题头': { subRole: 'PARENT_HEADER', boldLabel: true, indentDxa: 0 }
    }
  });
  const s2Lines = ctx2.sections[2].items.find(i => i.role === 'FULL_WIDTH_STRUCTURED')?.lines || [];
  assert.equal(s2Lines[0].role, 'PARENT_HEADER');
  assert.equal(s2Lines[0].boldLabel, true);
  assert.equal(s2Lines[1].role, 'VALUE_LINE');
  console.log('✅ PASS: roleOverrides 显式角色标注生效');
}
