# OpenSpec Specification: EP-1404 8 格式标准交付物受控生产契约

## 1. 契约定义与合规边界

### REQ-EP1404-01: 源文件事实无损摄入与双实体派生契约
- **1.1 (SHALL)**: 系统 **SHALL** 解析 `EP-1404 msds_CN 冠志.docx` 源文件，完整提取 Section 1 至 Section 16 的所有表格文本事实链。
- **1.2 (SHALL)**: Section 2 危险性概述 **SHALL** 绑定 `对水环境有慢性危害, 类别 3 (H412)`、防范说明 `P273, P501`；GHS 象形图与信号词按标准为空（类别 3 无象形图与信号词）。
- **1.3 (SHALL)**: Section 3 成分资料 **SHALL** 包含 `改性环氧聚合物`（>73%）与 `丙二醇甲醚`（CAS: 5131-66-8，25-30%）。全角 `＞` **SHALL** 归一化为 ASCII `> `。
- **1.4 (SHALL)**: 双实体派生中，国彩版本除 Section 1 实体名称、地址、应急联系方式合法替换外，Section 2~16 所有技术参数 **SHALL** 与冠志版本 100% 同构，差值为 0。

### REQ-EP1404-02: 八格式标准交付物矩阵完整产出契约
- **2.1 (SHALL)**: 系统 **SHALL** 在目标目录生成 4 份 DOCX 与 4 份高精度 PDF，共 8 份标准交付物。
- **2.2 (SHALL)**: 文件命名 **SHALL** 严格符合企业法定命名：
  - `EP-1404 msds_CN 冠志.docx` / `EP-1404 msds_CN 冠志.pdf`
  - `EP-1404 msds_CN 国彩.docx` / `EP-1404 msds_CN 国彩.pdf`
  - `EP-1404 msds_EN Guanzhi.docx` / `EP-1404 msds_EN Guanzhi.pdf`
  - `EP-1404 msds_EN Guocai.docx` / `EP-1404 msds_EN Guocai.pdf`
- **2.3 (SHALL)**: 8 份交付物的生成时间戳差值 **SHALL** 严格控制在 5 分钟以内。

### REQ-EP1404-03: 最新排版立法与槽位归属标准贯彻契约
- **3.1 (SHALL)**: Section 5 消防措施中，“在着火或爆炸情况下，不要吸进烟尘。”（英文 `In case of fire or explosion, do not breathe fumes/smoke.`）**SHALL** 物理归属于 5.3 物质或混合物的特殊危害，**SHALL NOT** 归入 5.4 预防措施与保护设备。
- **3.2 (SHALL)**: Section 5.4 **SHALL** 仅包含消防人员佩戴自供气式呼吸器与灭火用水控制。
- **3.3 (SHALL)**: 全篇 4 份 DOCX 所有表格第 1 列标签单元格 **SHALL** 统一设置为纯左对齐（`w:jc w:val="left"`），保留已有制表位悬挂缩进，**SHALL NOT** 包含任何两端对齐（`both`/`distribute`）或居中对齐（`center`）。
- **3.4 (SHALL)**: 全篇表格数据值单元格 **SHALL** 统一设置为纯左对齐（除成分表 CAS 与浓度居中外）。

### REQ-EP1404-04: 双极双层 165 项主审计满分核销与外部同步契约
- **4.1 (SHALL)**: 生成的 8 份交付物 **SHALL** 经过 `web/scripts/audit_bipolar_bilayer.mjs` 集中式主审计套件检验。
- **4.2 (SHALL)**: 审计套件执行退出码 **SHALL** 为 0，165 项质量断言（含 G-01 命名、G-36 时间戳、G-37 PDF字号、G-38 S9首字绝对垂直对齐、G-09 制表符纯度、L-S1~L-S16 专属局部规范）**SHALL** 100% 满分通过（缺陷数 = 0）。
- **4.3 (SHALL)**: 交付物 **SHALL** 物理同步至 `E:\冠志\TDS MSDS (2)\待处理文件\EP-1404\`，确保外部协同目录 8 份文件完整齐备。
