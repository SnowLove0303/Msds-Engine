# Specification: 跨语言事实保全、反硬编码与全景敌手强审计规范

## ADDED Requirements

### Requirement: 跨语言事实守恒与反硬编码规范
英文版交付物（包括 Section 4 急救措施、Section 9 理化特性、Section 12 生态学、Section 14 运输特殊要求）SHALL 严格从中文母版或源文件中动态解析并准确英译，严禁在流水线中硬编码脱离事实的静态英文常数。Section 14 仓储温度上限必须严格绑定源文事实（35℃），Section 12.3 必须忠实翻译无数据资料，严禁注入未经证明的鱼类无害结论。

#### Scenario: 跨语言事实动态对齐与反硬编码
- **GIVEN** 中文母版包含实测化学事实（如 35℃ 仓储温控、半透明乳液、130hPa 饱和蒸气压、20分钟眼睛冲洗）
- **WHEN** 流水线执行 `buildEnglishValuesFromFacts` 与 `fillEnglishTemplate`
- **THEN** 英文版必须输出 `Temperature must not exceed +35℃`、`Translucent emulsion`、`Approx. 130 hPa at 50℃`、`flush with plenty of warm water for at least 10 minutes` 修正为 `at least 20 minutes`，严禁出现 40℃ 硬编码与鱼类无害假声明。

---

### Requirement: 英文模板标签缺陷自愈与中英文同构规范
系统在装配英文模板时 SHALL 具备原生标签笔误自愈能力，自动将 Section 6.1 错位的消防标签修正为法定泄漏应急标签 `6.1 Personal precautions, protective equipment and emergency procedures:`。当源文件 Section 8 无职业接触限值时，英文版 SHALL 与中文版执行完全对称的剪枝，保持 11 行同构。

#### Scenario: 底模标签自愈与表格同构检验
- **GIVEN** 英文底层模板 Section 6.1 残留 `Firefighting precautions` 笔误，且 Section 8 残留 8.2 工程控制
- **WHEN** 流水线执行英文模板装配与格式收敛
- **THEN** Section 6.1 标签被自动自愈重写为合规应急标签，Section 8 被修剪为与中文版完全相同的 11 行结构。

---

### Requirement: 敌手强审计跨语言门禁规范
`audit_bipolar_bilayer.mjs` SHALL 增加跨语言基准事实硬断言，对温度篡改（40℃）、标签错位（消防应急）、生态假声明（鱼类无害）、理化失真与冲洗时间缩水实施机器硬阻断，任何一项失真必须触发测试红灯（退出码非 0）。

#### Scenario: 敌手强审计多维红灯阻断测试
- **GIVEN** 已生成的英文 DOCX 与 PDF 交付物
- **WHEN** 运行双极双层深度审计脚本 `audit_bipolar_bilayer.mjs`
- **THEN** 脚本必须对英文版的温度、标签、生态、理化、急救实施物理断言，全部吻合方可输出退出码 0 [Measured]。
