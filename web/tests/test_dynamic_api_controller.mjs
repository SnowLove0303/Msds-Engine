import { handleApiRequest } from '../src/msds-api-controller.js';
import { EventEmitter } from 'node:events';

function createMockReqRes({ method = 'GET', url = '/', body = null } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { host: 'localhost:5173' };

  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers || {};
    },
    end(data) {
      if (data) this.body += data;
    }
  };

  const promise = handleApiRequest(req, res);
  if (body) {
    req.emit('data', Buffer.from(JSON.stringify(body)));
  }
  req.emit('end');

  return { promise, res };
}

async function runTests() {
  console.log('=== Test 1: GET /api/msds/presets/default?lang=CN ===');
  const t1 = createMockReqRes({ method: 'GET', url: '/api/msds/presets/default?lang=CN' });
  await t1.promise;
  console.log('Status:', t1.res.statusCode);
  const data1 = JSON.parse(t1.res.body);
  console.log('Default CN preset name:', data1.data?.name);
  if (t1.res.statusCode !== 200 || !data1.success || !data1.data?.isDefault) {
    throw new Error('Test 1 failed: Default preset not returned');
  }

  console.log('\n=== Test 2: GET /api/msds/templates ===');
  const t2 = createMockReqRes({ method: 'GET', url: '/api/msds/templates' });
  await t2.promise;
  console.log('Status:', t2.res.statusCode);
  const data2 = JSON.parse(t2.res.body);
  console.log(`Found ${data2.total} templates:`, data2.data.map(t => t.key));
  if (t2.res.statusCode !== 200 || data2.total < 2) {
    throw new Error('Test 2 failed: Templates list incomplete');
  }

  console.log('\n=== Test 3: POST /api/msds/templates/inspect ===');
  const t3 = createMockReqRes({
    method: 'POST',
    url: '/api/msds/templates/inspect',
    body: { templateKey: 'CN_Guanzhi' }
  });
  await t3.promise;
  console.log('Status:', t3.res.statusCode);
  const data3 = JSON.parse(t3.res.body);
  console.log('Sections count in topology:', data3.sectionsCount);
  if (t3.res.statusCode !== 200 || data3.sectionsCount !== 16) {
    throw new Error(`Test 3 failed: Expected 16 sections, got ${data3.sectionsCount}`);
  }

  console.log('\n=== Test 4: POST /api/msds/presets/preset_guocai_cn/default ===');
  const t4 = createMockReqRes({
    method: 'POST',
    url: '/api/msds/presets/preset_guocai_cn/default'
  });
  await t4.promise;
  console.log('Status:', t4.res.statusCode);
  const data4 = JSON.parse(t4.res.body);
  console.log('Guocai isDefault now:', data4.data?.isDefault);
  if (t4.res.statusCode !== 200 || !data4.data?.isDefault) {
    throw new Error('Test 4 failed: Failed to set Guocai as default');
  }

  // Restore Guanzhi back to default
  const t4Restore = createMockReqRes({
    method: 'POST',
    url: '/api/msds/presets/preset_guanzhi_cn/default'
  });
  await t4Restore.promise;
  console.log('Restored Guanzhi back to default');

  console.log('\n🏆 ALL API CONTROLLER TESTS PASSED! Exit code 0.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
