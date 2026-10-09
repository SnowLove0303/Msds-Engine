# Tasks: 编辑器局部同步覆写模式落地任务分解

## 阶段 1：语义化键体系与预设持久化存储 (Data & Storage)
- [x] 1.1 在 `web/src/docx-engine.js` 中构建 `SEMANTIC_KEYS` 映射表与 `extractSemanticData` / `applySemanticOverrides` 核心方法。
- [x] 1.2 实现预设全局持久化管理器 `PresetStore`（支持 `localStorage` 读写、系统内置【英德国彩】预设初始化、预设的增删改查）。
- [x] 1.3 编写单元测试验证预设在切换模板（`CN 冠志` ↔ `CN 国彩` ↔ `EN 冠志`）时语义键命中率 100%，无坐标错位。

## 阶段 2：已有编辑器内嵌覆写模式 UI (Web Editor In-Place UX)
- [x] 2.1 在 Web 编辑器顶部工作条增加 `[同步覆写模式]` 切换开关与「当前图层选择器」（`基准视图` vs 各可用预设）。
- [x] 2.2 扩展已有编辑器的单元格渲染逻辑：处于预设图层时，动态比对基准值并渲染 `[继承基准]` 灰色角标或 `[已覆写]` 琥珀色高亮提示与 `[↺ 还原]` 按钮。
- [x] 2.3 单元格内容变动联动：在预设视图下直接打字，即刻自动将输入值记入当前预设的 `fieldOverrides` 并持久化。
- [x] 2.4 Section 00 支持预设全局标识覆盖（可单独为预设定义公司主体、型号、Footer 编号规则与导出文件名）。

## 阶段 3：跨模板衍生与多文件同步批量导出 (Multi-Export Pipeline)
- [x] 3.1 改造顶部导出按钮为 `[📦 同步覆写导出]`，点击弹出预设勾选与多文件预览抽屉。
- [x] 3.2 实现 `exportMultiPresetBundle` 核心流：根据勾选的预设列表，在后台快速按各预设的目标底模加载、克隆基准数据、注入预设差异补丁。
- [x] 3.3 支持一键生成与下载全部 DOCX（单文件直接保存，多文件连续下载或打包 ZIP）。

## 阶段 4：Python 覆写编辑器同步对齐 (`msds_template_editor.py`)
- [x] 4.1 在 Python 覆写模块中引入 `PresetStore`（持久化至本地 `editor_presets.json`），内置国彩主体预设。
- [x] 4.2 在已有 Tkinter 界面顶部增加「同步覆写模式」单选与预设切换控件，在现有单元格中呈现覆写提示。
- [x] 4.3 导出功能升级为支持勾选基准版与预设版批量导出 DOCX。

## 阶段 5：全流程自动化测试与 VS Code 协同交付 (Verification & Delivery)
- [x] 5.1 编写以 `OS-1338`（分类 111 ↔ 222 双主体导出）为标杆的自动化端到端测试用例。
- [x] 5.2 运行回归测试（`smoke.mjs`、`npm run build`、`py_compile`）。
- [x] 5.3 严格遵循 `RULE[user_global]` 通过 VS Code 检阅通道应用代码并推送到 GitHub。
