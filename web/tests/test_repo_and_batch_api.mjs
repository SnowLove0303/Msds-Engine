import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import {
  getDb,
  createBatch,
  listBatches,
  saveRecord,
  getRecords,
  getRecordById,
  deleteRecord,
  getDocxBuffer,
  updateRecordMatch,
  updateRecordAnnotations,
  getRepoStats,
} from '../src/msds-db.js';
import { handleApiRequest } from '../src/msds-api-controller.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

function createMockReqRes({ method = 'GET', url = '/', body = null }) {
  const req = {
    method,
    url,
    headers: { host: '127.0.0.1:5173' },
    listeners: {},
    on(event, cb) {
      this.listeners[event] = cb;
      if (event === 'data' && body) {
        cb(typeof body === 'string' ? Buffer.from(body) : Buffer.from(JSON.stringify(body)));
      }
      if (event === 'end') {
        setTimeout(cb, 5);
      }
      return this;
    },
  };

  const res = {
    statusCode: 200,
    headers: {},
    bodyChunks: [],
    writeHead(code, headers = {}) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(chunk) {
      if (chunk) this.bodyChunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      this.finished = true;
      if (this.onFinish) this.onFinish();
    },
    getJson() {
      const raw = Buffer.concat(this.bodyChunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c)))).toString('utf8');
      return JSON.parse(raw);
    },
    getBuffer() {
      return Buffer.concat(this.bodyChunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c))));
    },
    waitForFinish() {
      return new Promise((resolve) => {
        if (this.finished) return resolve();
        this.onFinish = resolve;
      });
    },
  };

  return { req, res };
}

async function test() {
  console.log('=== 开始测试 MSDS 智能匹配记录库与批量自动化 API ===\n');

  // 1. 测试直接调用 DB 模块
  console.log('1. 测试 DB 基础 CRUD...');
  const batchRes = createBatch({ batchId: 'TEST-BATCH-OFFICIAL', batchName: '自动化测试批次', createdBy: 'test_runner' });
  assert.equal(batchRes.batchId, 'TEST-BATCH-OFFICIAL');

  const pSample = 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/1-1 单组份水性聚氨酯树脂 PU/PU-202B/PU-202B msds_CN 冠志.docx';
  const sampleBuf = fs.readFileSync(pSample);

  const saveRes = saveRecord({
    id: 'REC-TEST-PU202B',
    batchId: 'TEST-BATCH-OFFICIAL',
    fileName: 'PU-202B msds_CN 冠志.docx',
    model: 'PU-202B',
    language: 'CN',
    entity: '冠志',
    templateVariant: 'CN_GUANZHI',
    status: 'PERFECT',
    matchedFields: 95,
    prunedFields: 10,
    conflictFields: 0,
    unmatchedFields: 0,
    docxBuffer: sampleBuf,
  });
  assert.equal(saveRes.id, 'REC-TEST-PU202B');

  const recDetail = getRecordById('REC-TEST-PU202B');
  assert.equal(recDetail.model, 'PU-202B');
  assert.equal(recDetail.matched_fields, 95);

  const docxBuf = getDocxBuffer('REC-TEST-PU202B');
  assert.ok(docxBuf && docxBuf.length > 10000, '必须能读出保存的 DOCX 二进制');
  console.log('   DB CRUD 校验通过！');

  // 2. 测试 API 控制器: GET /api/msds/repo/stats
  console.log('\n2. 测试 API: GET /api/msds/repo/stats...');
  const { req: reqStats, res: resStats } = createMockReqRes({ method: 'GET', url: '/api/msds/repo/stats' });
  await handleApiRequest(reqStats, resStats);
  await resStats.waitForFinish();
  const statsJson = resStats.getJson();
  assert.equal(statsJson.success, true);
  assert.ok(statsJson.data.totalRecords >= 1);
  console.log('   Stats 接口返回正常:', statsJson.data);

  // 3. 测试 API 控制器: GET /api/msds/repo/records
  console.log('\n3. 测试 API: GET /api/msds/repo/records...');
  const { req: reqList, res: resList } = createMockReqRes({ method: 'GET', url: '/api/msds/repo/records?query=PU-202B' });
  await handleApiRequest(reqList, resList);
  await resList.waitForFinish();
  const listJson = resList.getJson();
  assert.equal(listJson.success, true);
  assert.ok(listJson.data.records.length >= 1);
  assert.equal(listJson.data.records[0].model, 'PU-202B');
  console.log('   Records 列表检索正常，命中记录数:', listJson.data.records.length);

  // 4. 测试 API 控制器: POST /api/msds/repo/batch/import (通过文件路径批量摄入)
  console.log('\n4. 测试 API: POST /api/msds/repo/batch/import (自动化批量摄入真实样本)...');
  const importBody = {
    batchName: '真实样本批量摄入测试',
    filePaths: [pSample],
    templateVariant: 'CN_GUANZHI',
    createdBy: 'ai_subagent',
  };
  const { req: reqImport, res: resImport } = createMockReqRes({
    method: 'POST',
    url: '/api/msds/repo/batch/import',
    body: importBody,
  });
  await handleApiRequest(reqImport, resImport);
  await resImport.waitForFinish();
  const importJson = resImport.getJson();
  assert.equal(importJson.success, true);
  assert.equal(importJson.successCount, 1);
  const ingestedRecId = importJson.results[0].id;
  console.log('   批量摄入成功！生成记录 ID:', ingestedRecId, '型号:', importJson.results[0].model);

  // 5. 测试 API 控制器: POST /api/msds/repo/records/:id/rematch (重新匹配与算法回归)
  console.log('\n5. 测试 API: POST /api/msds/repo/records/:id/rematch...');
  const { req: reqRematch, res: resRematch } = createMockReqRes({
    method: 'POST',
    url: `/api/msds/repo/records/${ingestedRecId}/rematch`,
  });
  await handleApiRequest(reqRematch, resRematch);
  await resRematch.waitForFinish();
  const rematchJson = resRematch.getJson();
  assert.equal(rematchJson.success, true);
  assert.ok(rematchJson.data.matchedFields > 0);
  console.log('   重新匹配成功！对齐字段数:', rematchJson.data.matchedFields, '冲突数:', rematchJson.data.conflictFields);

  // 6. 测试 API 控制器: POST /api/msds/repo/records/:id/annotations
  console.log('\n6. 测试 API: POST /api/msds/repo/records/:id/annotations...');
  const { req: reqAnn, res: resAnn } = createMockReqRes({
    method: 'POST',
    url: `/api/msds/repo/records/${ingestedRecId}/annotations`,
    body: {
      annotations: [
        { id: 'ANN-1', sectionNumber: 12, comment: '生态毒性已完美匹配', status: 'resolved' },
      ],
    },
  });
  await handleApiRequest(reqAnn, resAnn);
  await resAnn.waitForFinish();
  const annJson = resAnn.getJson();
  assert.equal(annJson.success, true);
  assert.equal(annJson.data.annotationsCount, 1);
  console.log('   批注持久化同步成功！');

  // 7. 清理测试数据
  deleteRecord('REC-TEST-PU202B');
  deleteRecord(ingestedRecId);
  console.log('   测试数据清理完成。');

  console.log('\n🎉 MSDS 智能匹配记录库与批量自动化 API 100% 验证通过！');
}

test().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
