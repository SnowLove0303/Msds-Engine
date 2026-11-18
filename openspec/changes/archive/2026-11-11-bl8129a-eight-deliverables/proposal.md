# Proposal: BL-8129A 八格式 MSDS 受控覆写

## Why

用户要求以 BL-8129A 中文冠志 MSDS 为源，使用已安装的 msds-studio 能力生成中英双语、冠志与国彩两个主体的 8 份正式交付物。项目流水线要求输出 4 份 DOCX 和 4 份 PDF，同时保留源文件事实、原始文件和目标目录纯净度。

## What Changes

- 通过 MSDS 官方 MCP 通道识别源文件、核对四套模板身份并锁定输出矩阵。
- 在第二道项目门禁通过后，以官方批量流水线生成 BL-8129A 的 8 个文件。
- 对源文件、模板输出、双语事实对应、PDF 内容和目标目录纯净度执行机械与认知审计。
- 不修改 MSDS-Engine 代码、模板、MCP 工具或源文件。目标目录当前为空。
- Section 15 follows the protected project invariant INV-S15-01: the pipeline modernizes references to Decree 591 / the GB 30000 series rather than copying the source's 344 / GB 20576 citations verbatim. This policy-driven normalization is recorded for review.
- 生产前置审计契约存在不完整字段。本次不以工具未执行的断言替代源事实；单独记录比较工具与实际审计结果，未通过的硬门禁会如实阻断验收。

## Capabilities

### New Capabilities

None. This is a product-specific production run and introduces no system behavior.

### Modified Capabilities

None.

The change sets skip_specs: true because it does not change system behavior.

## Impact

- Source DOCX: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A/BL-8129A/中文版/BL-8129A msds_CN 冠志.docx
- Target directory: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A
- Official MCP route: web/scripts/msds_mcp_gateway.mjs calling msds_batch_export_eight, followed by msds_compare_source_with_output and msds_audit_deliverables.
- Current branch and baseline: main at 5c304c3a986d7758c34a8c4665a7bd17d630f83d. The working tree contains unrelated pre-existing untracked files. Only this new OpenSpec change and the requested target artifacts are in scope.
- The pipeline preserves source DOCX/PDF copies beside the source when no existing preservation copy is present. Those copies are outside the target delivery directory.
- Evidence so far: [Measured] source recognition succeeded via MCP; [Measured] target directory is empty; [Measured] the source folder contains the requested DOCX and paired PDF; [Measured] source DOCX SHA-256 is 751ea97af73f49ae14e7c23e4c6f99dd874028a533243123714495e711553098 and paired PDF SHA-256 is 4b821f2faa728044521d0be4d9ad1b7db3a719d1de4daf895d76d55ad77a5088.

## Original user request (verbatim)

> "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\6-2 水性封闭型异氰酸酯固化剂 BL\BL-8129A\BL-8129A\中文版\BL-8129A msds_CN 冠志.docx"  基于技能调用MSDS-Studio 识别与编辑器执行BL-8129A 的八格式覆写产出文件到F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\06-2 水性封闭型异氰酸酯固化剂 BL\BL-8129A

## Later user directive (chronological)

> “执行”

## Later user directive (chronological)

> “不准修改共享引擎和审计逻辑，有问题就把详细的问题写成报告md给我，另外我发现你没有严格按照Skill中的规定的工作流去使用编辑器输入产出，导致产出的内容的表格格式、文本格式等未符合规范，禁止绕过编辑器！”


## Latest user directive (chronological)

> “不合格，重新做，你产出物明显没有使用编辑器及其模板”

Response: regenerated all eight deliverables using MSDS-Studio editor operations and official templates/presets. The generic bilingual audit now passes 112/112, but the bipolar audit and source comparison still have open failures documented in the report. No shared engine, template, or audit logic was changed.
