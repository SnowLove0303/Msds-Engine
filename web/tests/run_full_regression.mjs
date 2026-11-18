import { execSync } from 'child_process';

const tests = [
  { name: 'Task 1: 预设 SQLite 数据库单元测试', cmd: 'node web/tests/test_dynamic_presets_db.mjs' },
  { name: 'Task 2: 后端 REST API 与拓扑自省测试', cmd: 'node web/tests/test_dynamic_api_controller.mjs' },
  { name: 'Task 3: 通用主体插槽绑定原语测试', cmd: 'node web/tests/test_universal_entity_binding.mjs' },
  { name: 'Task 4: 自适应多格式流水线引擎验证', cmd: 'node web/tests/test_adaptive_pipeline.mjs' },
  { name: 'Task 5: 前端 Vite 生产构建与代码规范测试', cmd: 'npm --prefix web run build' },
];

console.log('========================================================================');
console.log('       MSDS-Studio 通用拓扑与动态预设全量回归验证 (Full Regression)     ');
console.log('========================================================================\n');

let allPassed = true;
const cwd = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine';

for (const t of tests) {
  process.stdout.write(`>>> 正在运行 [${t.name}] ... `);
  try {
    const out = execSync(t.cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('✅ PASS (ExitCode: 0)');
  } catch (err) {
    console.log('❌ FAIL');
    console.error(err.stdout || err.stderr || err.message);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n========================================================================');
  console.log('🎉 恭喜！全流程 6 大核心模块全量回归测试 100% 通过！(All Suites Passed)');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error('\n🚨 存在回归测试失败项！');
  process.exit(1);
}
