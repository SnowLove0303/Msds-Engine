# 实施任务清单：双语翻译逐行逐句细节零遗漏与 Section 12.2 细节补齐

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: Section 12.2 持久性和降解性英文翻译细节 100% 物理补齐 (REQ-TRANS-01)**
  - **因果目标**：在 `web/src/pipeline-engine.js:translatePersistenceValueToEnglish` 中实现实验数据、周期、导则号与类似产品研究的逐句无损精细化翻译
  - **操作要点**：
    1. 移除过早的纯定性结论截断逻辑；
    2. 支持 `< 60 %`、`28 d`、`the product is not readily biodegradable`、`Method: OECD Test Guideline 301D`、`Studies on a similar product` 全量翻译；
    3. 源码修改必须通过 `review_diff_in_vscode` 检阅。
  - **验收门禁**：单元测试验证中文详细降解性文本翻译出完整句式，无任何细节丢失，退出码 0。

- [x] **Task 2: 执行层双语翻译逐行逐句细节零遗漏机械硬阻断审计门禁下沉 (REQ-TRANS-02)**
  - **因果目标**：在 `web/scripts/run_master_msds_audit.mjs` 中增加 `INV-TRANS-ZERO-OMISSION` 机械门禁，对全文档特别是 Section 11/12/14 执行数值与导则号零遗漏核对
  - **操作要点**：
    1. 在 Ring 4 增加全文档逐行逐句对账算法；
    2. 自动检查中文中的数值、百分比、时间单位、OECD 导则号在英文中是否存在；
    3. 源码修改必须通过 `review_diff_in_vscode` 检阅。
  - **验收门禁**：主审计套件增补该规则并具备反欺诈防御能力，退出码 0。

- [x] **Task 3: PU-2346A 8 份标准交付物重新编译与 171 项全量主审计核销 (REQ-TRANS-03)**
  - **因果目标**：重新编译 8 份交付物并同步到用户工作目录，确保所有审计门禁 100% 满分通过
  - **操作要点**：
    1. 重新生成 PU-2346A 8 份标准交付物并同步到 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
    2. 验证生成的 DOCX 文件中 Section 12.2 的实际翻译内容；
    3. 运行 `npm run lint`，确保 0 errors, 0 warnings（退出码 0）；
    4. 运行 `web/scripts/run_master_msds_audit.mjs`，确保 171/171 项全绿（退出码 0）；
    5. 记录根因、解法至 `CHANGELOG.md`。
  - **验收门禁**：171/171 主审计全绿，Lint 零错误零警告，真实退出码 0。
