# Spec Delta

## Purpose

让 DOCX→PDF 转换成为交付物自带、跨平台一致可用的能力：任何一台设备只要拿到本交付物（容器镜像或可移植目录），无需另行安装组件即可把已产出的 Word 文档转换为分页、行高与表格高度一致的 PDF，并且能力缺失时可在导出前被明确诊断而不是事后失败。

## ADDED Requirements

### Requirement: Cross-Platform Conversion Availability

系统 SHALL 在任何受支持平台上提供 DOCX→PDF 转换能力：Docker 容器（Linux）、Windows 宿主机直跑、macOS 与其它 Linux 发行版。转换运行时 SHALL 按固定优先级解析：环境变量显式指定 → Windows COM 自动化（仅 Windows 且本机存在可用组件）→ 交付物内置运行时 → 系统已安装的转换器；系统 SHALL 记录并回报最终选用的后端类型。

#### Scenario: 内置运行时优先于系统安装

- **WHEN** 交付物内置运行时目录存在且可执行，同时系统另装有一份转换器
- **THEN** 系统 MUST 选用内置运行时，并在能力信息中把后端类型标记为内置

#### Scenario: 环境变量显式指定可覆盖探测

- **WHEN** 环境变量显式指向一个可用的转换器可执行文件
- **THEN** 系统 MUST 优先使用该可执行文件，并忽略 Windows COM、内置目录与系统安装

#### Scenario: Windows 上优先使用 COM 自动化

- **WHEN** 运行平台为 Windows，未设置环境变量，且本机存在可用的文字处理 COM 组件
- **THEN** 系统 MUST 使用 COM 自动化完成转换并把后端类型标记为 COM，即使交付物内置运行时同样可用

#### Scenario: 非 Windows 平台使用内置运行时

- **WHEN** 运行平台为 Linux 或 macOS，未设置环境变量，且交付物内置运行时可用
- **THEN** 系统 MUST 使用内置运行时完成转换并把后端类型标记为内置

#### Scenario: 无任何可用运行时

- **WHEN** 四种来源全部不可用
- **THEN** 系统 MUST 把 PDF 能力标记为不可用，回报可诊断的原因，且 MUST NOT 因此在健康检查或页面加载时抛出未捕获异常

### Requirement: Bundled Runtime and Offline Delivery

交付物 SHALL 自带转换运行时与必需字体，使转换能力不依赖宿主机预装组件，也不需要联网获取额外组件。

#### Scenario: 容器内无需宿主机安装即可转换

- **WHEN** 在一个未安装任何转换器与字体的宿主机上运行本交付物的容器镜像
- **THEN** 容器内部 MUST 能独立完成 DOCX→PDF 转换，结果为有效 PDF，且不依赖宿主机挂载的转换器

#### Scenario: 新设备拷贝交付物即可用

- **WHEN** 把交付物目录整体拷贝到一台未安装任何转换器的新设备并启动服务
- **THEN** PDF 能力 MUST 立即可用，无需在该设备上执行任何安装步骤

#### Scenario: 离线环境可用

- **WHEN** 运行环境无法访问外网
- **THEN** PDF 转换 MUST 仍然可用

### Requirement: CJK Font Readiness and Deterministic Substitution

交付物 SHALL 提供覆盖中文的字体，并 SHALL 对文档中引用的、交付物未提供的字体名定义确定性的替换映射，使中文内容不出现缺字方块，且行高与换行结果在同一运行时下保持稳定可重复。

#### Scenario: 中文内容无缺字

- **WHEN** 转换一份含中文标签与中文数值的 MSDS 文档
- **THEN** 生成的 PDF MUST 不出现缺字方块或空白字符替代，且文本可被正常提取

#### Scenario: 字体缺失时替换确定

- **WHEN** 文档引用的字体名不在交付物提供的字体集合内
- **THEN** 系统 MUST 按预先声明的映射替换为交付物提供的字体，且同一文档重复转换 MUST 得到相同的替换结果

#### Scenario: 字体就绪状态可观测

- **WHEN** 查询 PDF 能力信息
- **THEN** 响应 MUST 包含字体是否就绪的结论，以及缺失时的具体字体或映射项

### Requirement: Capability Self-Check and Pre-Flight

系统 SHALL 在健康检查中回报 PDF 能力详情，并在任何导出动作开始前完成预检。

#### Scenario: 健康检查回报能力详情

- **WHEN** 客户端请求健康检查接口
- **THEN** 响应 MUST 包含 PDF 可用性布尔值、后端类型、后端版本、字体就绪状态，以及不可用时的原因文本

#### Scenario: 导出前预检

- **WHEN** 客户端发起任一需要 PDF 的导出请求
- **THEN** 系统 MUST 在生成任何文件之前完成能力预检，MUST NOT 在已完成大量转换工作后才报告能力缺失

#### Scenario: 能力缺失时快速失败且信息可操作

- **WHEN** PDF 能力不可用而客户端请求仅 PDF 导出
- **THEN** 系统 MUST 以明确的失败响应拒绝该请求，响应中 MUST 说明缺失的组件与推荐的补救方式

### Requirement: Graceful Export Degradation

当导出请求同时要求 Word 与 PDF 而 PDF 能力不可用时，系统 SHALL 仍然交付已生成的 Word 文档，并在响应中明确标注 PDF 部分缺失及原因，而不得整体失败。

#### Scenario: both 模式在 PDF 缺失时仍交付 Word

- **WHEN** 客户端以"Word + PDF"模式导出，且 PDF 能力不可用
- **THEN** 响应 MUST 成功返回全部 DOCX 产物，且 MUST 标注 PDF 未生成及原因

#### Scenario: 仅 PDF 模式不产生半成品

- **WHEN** 客户端以"仅 PDF"模式导出，且 PDF 能力不可用
- **THEN** 系统 MUST 不返回任何部分产物，并以可操作的失败信息回应

### Requirement: Deterministic Output and Fidelity Baseline

同一输入 DOCX 在同一运行时与同一配置下重复转换 SHALL 产生页数与文本内容一致的 PDF。系统 SHALL 以仓库内金标样本作为保真度基线，保证分页、行高与表格结构与 Word 产出高度一致。

#### Scenario: 重复转换结果一致

- **WHEN** 对同一份 DOCX 连续转换两次
- **THEN** 两次产出的页数 MUST 相同，且提取文本 MUST 逐字相同

#### Scenario: 基线先测量后固化

- **WHEN** 首次建立保真度基线
- **THEN** 系统 MUST 用 Windows COM 与交付物内置运行时分别转换金标样本 `算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.docx`，量出两者相对仓库内同名金标 PDF `算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.pdf` 的页数差异与文本差异，并把量得的容差固化进回归测试

#### Scenario: 保真度回归受已固化容差约束

- **WHEN** 运行保真度回归测试
- **THEN** 测试 MUST 以已固化的容差为唯一判据，页数偏差或文本差异超出容差时 MUST 判为失败

#### Scenario: 金标样本文本完整

- **WHEN** 提取金标样本产出 PDF 的文本
- **THEN** 其 MUST 包含源 DOCX 的全部可见标签与数值文本，且 MUST NOT 出现缺字替代字符

#### Scenario: 表格结构保持

- **WHEN** 转换含多张表格的 MSDS 文档
- **THEN** 产出 PDF 中表格的行数与列数 MUST 与源 DOCX 对应表格一致，且 MUST NOT 出现跨页错位导致的列丢失

### Requirement: Batch Conversion Filename Contract

批量转换 SHALL 为每个输入 DOCX 产出同名基名的 PDF，命名规则 MUST 与既有导出命名契约保持一致。

#### Scenario: 批量转换命名对应

- **WHEN** 一次批量请求传入 N 份 DOCX
- **THEN** 响应 MUST 返回 N 份 PDF，且第 i 份 PDF 的文件名 MUST 为第 i 份输入 DOCX 的基名加 `.pdf` 扩展名

#### Scenario: 四变体批量导出完整

- **WHEN** 以四变体（中英双语 × 冠志/国彩）批量导出 PDF
- **THEN** 结果 MUST 为 4 份非空 PDF，且各自命名与对应变体一致
