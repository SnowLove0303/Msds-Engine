# standardized-recognition Specification

## Purpose
TBD - created by archiving change msds-engine-standardized-recognition-editor-mcp. Update Purpose after archive.

## Requirements

### Requirement: 任意源 DOCX 全量结构化识别解包
系统 SHALL 提供独立的识别引擎，从输入的 Word (.docx) 源文件中无损提取 16 章节全部未分类的原始段落、表格、GHS 声明、CAS 组分列表、理化测试值及毒理学试验数据，输出标准事实结构体。

#### Scenario: 提取 GHS 危险性要素
- GIVEN 用户提供一份包含 GHS 危险品分类的 MSDS 源文件
- WHEN 识别引擎执行 `parseSourceDocx`
- THEN 引擎 SHALL 动态识别出 2.1 危险类别列表、2.2 信号词、H代码及描述、P防范说明分组（预防/响应/储存/处置）及 2.3 其他危险，严禁信息丢失。
