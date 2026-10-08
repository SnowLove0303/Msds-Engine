# Tasks

## 1. 事实解构与通用清洗管道 (Decomposition & Typographic Sanitation)

- [x] 1.1 实现 Run 级粗细体样式角色分离器 (`decomposeRunsToFact`)，结合字数阈值（>10字加粗内容修正为普通值，Section标题除外）与同一行父级标签上下文感知，杜绝将加粗长文本误判为标签。
- [x] 1.2 实现上下文感知的高保真冒号切分器 (`safeColonSplit`)，保护时间格式 (`12:00`)、化学比例 (`1:1`) 及标准代号，防止行内误切。
- [x] 1.3 实现自造序号前缀剥离与脱敏器 (`stripNumberingPrefix`)，剔除 `1.1`、`9.3`、`（1）` 等前缀用于语义对齐，同时在元数据中留存原始定位。
- [x] 1.4 实现通用文本保真清洗器 (`sanitizeTypographyAndSymbols`)，剔除零宽字符与不可见空白，保真度量衡、温度与紧凑固有名词斜杠（如 `通风/排气`）。

## 2. 语义槽位绑定与防穿透协议 (Semantic Slot Binding & OW-029 Enforcement)

- [x] 2.1 规范统一槽位注册契约与寻址抽象 (`s{section}:{slot_id}`)，基于标准名称与语义别名字典进行模糊/精确对齐。
- [x] 2.2 落实 OW-029 铁律，彻底封禁任何基于行号的物理位置推断，所有行数据必须由语义别名决定归宿。
- [x] 2.3 实现多事实同一槽位独占性与冲突检测器 (`detectSlotConflicts`)，同义等价值自动去重，异值冲突赋予 `REVIEW_AMBIGUOUS`。

## 3. 真假缺失与实质否定分流引擎 (Missing vs. Substantive Negative Engine)

- [x] 3.1 实现无数据/未测占位符精准识别器 (`isPureMissingValue`)，匹配 `无数据`、`未测`、`—`、`No data` 等纯缺省项。
- [x] 3.2 实现实质否定结论白名单保护机制 (`isSubstantiveNegativeFinding`)，对 `不适用`、`非危险品`、`无危险反应`、`初沸点以下无闪点`、`无刺激` 等依法保留的负面结论提供 100% 绝对保护。
- [x] 3.3 封堵误剪枝漏洞，确保实质否定结论直接分类为有效数据，严禁流入 `PRUNED` 剪枝池。

## 4. 统一六大处置状态机 (6-Action Decision Machine)

- [x] 4.1 升级核心匹配决策流，输出唯一的处置状态枚举：`MATCHED`、`PRUNED`、`EMPTY`、`NOT_APPLICABLE`、`UNMATCHED`、`REVIEW_AMBIGUOUS`。
- [x] 4.2 为每个提取行补充审计证据链（包含命中原因 `reason`、原始识别片段 `rawSnippet`、槽位编号 `slotKey`）。

## 5. 模板引擎原子安全交接契约 (Atomic Handoff & Descending Deletion)

- [x] 5.1 重构 `applyMatchResultToEditor`，确保仅向模板非加粗值格写入内容（字号 12pt），保持标签与结构物理锁死。
- [x] 5.2 实现自底向上（倒序）安全删行管线，遍历待删索引前执行降序排序，杜绝行索引漂移。
- [x] 5.3 删行后自动触发 `renumberRecord`，确保剩余行编号连贯严整。

## 6. 自动化测试与系统闭环回归 (Automated Testing & E2E Verification)

- [x] 6.1 在 `web/tests/smoke.mjs` 中添加全局匹配引擎专项断言，覆盖 Run 解构、冒号保护、实质否定不误剪、六大状态机流转与倒序删行。
- [x] 6.2 运行自动化测试套件 (`npm run test:smoke` 与 `npm run build`)，确保 100% 测试通过且前端编译零告警。
