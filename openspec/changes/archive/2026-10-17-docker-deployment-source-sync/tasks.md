# Tasks: Docker 部署源码与 v1.5.0-Complete 发行包对齐

## 1. 变更登记与回滚保险

- [x] 1.1 在 `openspec/changes/docker-deployment-source-sync/` 建立 proposal、tasks 与 spec delta，并通过 `openspec validate`
- [x] 1.2 记录变更前事实：git HEAD、`git status`、镜像 ID 与构建时间、容器内 `web/src` 归一化哈希
- [x] 1.3 将当前镜像打 tag `msds-engine-msds-engine:rollback-oct11`
- [x] 1.4 归档旧 `web/src`、旧 `web/package-lock.json`、未跟踪脚本与更新前顶层清单到 `_rollback/pre-v1.5.0-20261017/`

## 2. 源码对齐

- [x] 2.1 从原始 ZIP 重新提取纯净包到工作区暂存区，并与包内文件数逐条核对（2098 个文件）
- [x] 2.2 以镜像方式覆盖 `F:\docker\projects\Msds-Engine`，排除 `.git`、`output`、`web/data`、`scratch`、`_rollback` 与未跟踪脚本
  - 注：排除未按预期生效，见第 6 节事故记录；源码对齐本身正确，被误伤的目录已在 6.3 恢复
- [x] 2.3 校验对齐结果：源文件缺失 0、大小不符 0、多余 0（排除保留项）
- [x] 2.4 确认保留项完好：该检查在执行后立即运行并如实发现 `web/data/msds_repo.db` 与 `output/` 被误覆盖；处置与恢复见第 6 节

## 3. 重建与上线

- [x] 3.1 在目标目录执行 `docker compose build`（exit 0）
- [x] 3.2 执行 `docker compose up -d` 使容器运行新镜像（镜像 ID 由 `308ba41d…` 变为 `d19558ce…`）
- [x] 3.3 等待健康检查通过，确认容器状态为 healthy

## 4. 验收

- [x] 4.1 容器内 `web/src` 12 个文件归一化哈希与包内逐项一致
- [x] 4.2 `/api/version` 返回 `status: ok`，版本号 `1.5.0`；宿主 `http://127.0.0.1:5173/` 返回 HTTP 200
- [x] 4.3 `web/dist/assets` 产物为 `index-ByCMs-Ko.js` (529,544 B) 与 `index-CzOR4deU.css` (76,003 B)，既不同于旧镜像产物，又与包内预构建完全一致
- [x] 4.4 记录 PDF 导出在容器内不可用为已知限制（见 proposal「已知限制」），并以独立变更跟踪

## 5. 收尾

- [x] 5.1 将本次对齐提交到该仓库 git
- [x] 5.2 归档 change 并同步 `openspec/specs/deployment-source-parity/`

## 6. 事故与恢复（robocopy 多路径 `/XD` 未生效导致保留项被覆盖）

- [x] 6.1 定位失效机制并最小复现：多路径 `/XD` 配合 `/MIR` 时只有最后一个路径生效，记录到 `_rollback/pre-v1.5.0-20261017/_incident-and-restore-report.md`
- [x] 6.2 从回滚镜像恢复实时数据库：`msds_repo.db` 恢复后 MD5 `1ee04a91feacf93514bbcede219970ed`，与变更前记录值完全一致
- [x] 6.3 恢复 `scratch/` 至变更前状态（保留包内新增 `supervisor-controls-audit-20261017/`），恢复后 47 个文件
- [x] 6.4 恢复 `output/`：13 个中恢复 10 个，其中 8 个字节可验证（含未被破坏的 `user_correct_2341.docx`）、2 个按同尺寸推定重建
- [x] 6.5 如实记录不可恢复项与处置：
  - `output/compare_msds.mjs`（4,149 B 旧修订）—— 已被包内根级 4,240 B 后续修订取代，不再放回
  - `output/comparison_report.txt`（40,558 B）—— 无法恢复，可由根级 `compare_msds.mjs` 重新生成
  - `output/comparison_report_utf8.txt`（32,025 B）—— 同上，为同一报告的另一编码版本
- [x] 6.6 重建被 purge 删除的 `openspec/changes/docker-deployment-source-sync/`（它创建于镜像之前、包内不存在，属未跟踪文件）
- [x] 6.7 固化后续准则：破坏性镜像操作前必须完整归档待保护目录，禁止依赖多路径 `/XD` + `/MIR` 保护目录内容
