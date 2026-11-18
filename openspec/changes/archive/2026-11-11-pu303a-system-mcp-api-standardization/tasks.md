# Tasks: PU-303A MSDS 系统受控 API 通道生产任务清单

- [x] Task 1: 启动 MSDS-Engine API 守护服务并完成服务探活预检 <!-- id: 1 -->
  - 在 `web/` 下启动后台独立无头服务 `npm run api`（监听 127.0.0.1:5174）
  - 发起 `GET http://127.0.0.1:5174/api/msds/health` 探活请求，确认 `status === "ok"`
  - 验证命令: `node "C:\Users\Administrator\.gemini\antigravity\brain\1a4d6938-54aa-4835-a9a6-96e907dcccf0\scratch\verify_health.mjs"`

- [x] Task 2: 通过 API 通道驱动 PU-303A 全生命周期原子化生产与 8 格式导出 <!-- id: 2 -->
  - 调用 `POST http://127.0.0.1:5174/api/msds/pipeline/generate-eight`
  - 载荷参数：
    - `model`: `"PU-303A"`
    - `cnGroundTruthPath`: `"F:\\App Location\\Guanzhi Tong\\Skill\\MSDS Skill\\TDS MSDS 预处理\\1-1 单组份水性聚氨酯树脂 PU\\PU-303A\\PU-303A msds_CN 冠志.docx"`
    - `targetDir`: `"F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\TDS MSDS 重写版\\01-1 单组份水性聚氨酯树脂 PU\\PU-303A"`
  - 确认 Section 2 通栏排版组装生效（`gridSpan="2"`, 9795 dxa）
  - 验证命令: `node "C:\Users\Administrator\.gemini\antigravity\brain\1a4d6938-54aa-4835-a9a6-96e907dcccf0\scratch\run_pipeline_pu303a.mjs"`

- [x] Task 3: 目标目录交付物纯度核验与源文件留存备份审查 <!-- id: 3 -->
  - 检查源文件目录已成功生成 `PU-303A msds_CN 冠志_源文件留存.docx`，实现母本只读防污染
  - 检查目标输出目录仅有 8 份标准交付物（4 DOCX + 4 PDF），零临时 dump 杂件
  - 验证命令: `node "C:\Users\Administrator\.gemini\antigravity\brain\1a4d6938-54aa-4835-a9a6-96e907dcccf0\scratch\verify_task3.mjs"`

- [x] Task 4: 零信任全景双极双层深度审计与 1:1 双向物理核销 <!-- id: 4 -->
  - 运行机械全景审计脚本核验 8 格式交付物排版几何、字体纯净度、零中文残留与通栏拓扑
  - 执行 1:1 双向物理核销，确认 REQ-01 ~ REQ-05 全部实测绿灯
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\audit_bipolar_bilayer.mjs" "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-303A"`
