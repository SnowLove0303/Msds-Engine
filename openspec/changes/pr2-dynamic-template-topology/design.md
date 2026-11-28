# Design: PR-2 模板动态认知与能力驱动匹配

## 1. 动态 Section 发现与能力识别
- `discoverSectionNumberFromHeader(titleText, fallbackIndex)`：从表格首行文本提取 `第 N 部分` / `Section N` / `N.`，未命中时回退为 `fallbackIndex`。
- `classifySectionLayout(rowsTopology)`：
  - 全部数据行为单列 -> `FULL_WIDTH_OUTLINE`
  - 存在 `>=3` 列且含双列/单列混排或纯多列 -> `MULTI_COL_GRID`
  - 同时含 1 列与 2 列 -> `HYBRID`
  - 其余 -> `KV_TWO_COL`
- `buildTemplateProfile(blueprint)`：生成标准化 `Template Manifest` JSON，供下游匹配与参数化审计消费。

## 2. 能力驱动匹配 (`compileTopologyOps`)
- `normalizeTemplateSections(templateSchema)`：兼容数组（`recognizeTemplateTopology` 输出）与对象映射（`inspectTemplateSchema` 输出），按模板实际章节列表迭代编译。
- 当 `tplSec.layoutType === 'FULL_WIDTH_OUTLINE'`（或显式 `FULL_WIDTH` + `FULL_WIDTH_STRUCTURED`）时，走通用通栏大纲编译路径，不再写死 `s === 2`。
