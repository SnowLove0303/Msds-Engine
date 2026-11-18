import fs from 'fs';

// 1. Update ARCHITECTURE.md
let arch = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\ARCHITECTURE.md', 'utf8');

const archSection = `
## MSDS Overwrite & Typography Invariants (中英文覆写与排版法定不变量)

系统严格遵照根目录《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》执行，确立以下不可被后续任何变更篡改的法定不变量：

1. **唯一真理源（SOT）双通道统一公理**：Web 工作台编辑器交互导出与 Headless Agent API 自动化流水线，在字段映射、排版几何、模板剪枝与断言门禁上保持 100% 相同表现；
2. **值格 100% 纯左对齐与自然词距公理 (Flush Left Mandate)**：全篇所有章节表格的值格（Col 1+ 数据列）强制应用 \`w:jc val="left"\`，彻底消除 Word 两端对齐/分散对齐导致的词距与字距异常拉大；缩进彻底清零；
3. **第一列“文字对文字”垂线对齐公理**：
   - 常规章节统一采用 \`420 dxa\` 悬挂缩进；
   - Section 11（含 5 字符的 \`11.10\`，宽度约 452 dxa）专属放宽至 \`565 dxa\` 悬挂缩进（底模原生规范），彻底杜绝制表符溢出跳步弹飞；
   - 无序号标签（如 \`Chemical category:\` / \`GHS Pictograms:\`）强制右缩进（\`420|565 dxa\`）对齐文字首字母；
   - Section 8 \`Recommendation:\` 参照中文版规范取消缩进，顶格纯左对齐加粗；
4. **重点章节结构拓扑公理**：
   - Section 2：非危 4 行 / 危化 8 行动态切换；规整双列行免复合解耦，核心分类事实防误删保护；2.5 防范说明剔除重复总标题、取消大类间空行、小标题加粗、P 规程常规体；
   - Section 3：具体化学成分名称绝对严禁加粗，严禁追加多余冒号；
   - Section 9：所有数值与未测状态彻底废除居中，全部强制左对齐；
   - Section 11：15 行标准拓扑；11.7 生殖毒性跨列合并保护（\`gridSpan="3"\`, \`w="6262"\`）；
   - Section 13：严格重构为 4 行结构（2 行独立单列通栏说明行 + Disposal methods 双居中加粗 + 处置正文纯左对齐）；
5. **页脚法定规范**：Cell 0 公司全称型号强制绝对左对齐，Cell 1 \`Revision Date:\` 首字母大写强制绝对右对齐且同步当前最新时间；
6. **全流程 7 大自动化质量断言门禁 (Gate 1 ~ 7)**：所有发布前必须通过自动化断言，任何一项失败立即抛出异常熔断。
`;

if (!arch.includes('## MSDS Overwrite & Typography Invariants')) {
  arch += archSection;
  fs.writeFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\ARCHITECTURE.md', arch, 'utf8');
  console.log('ARCHITECTURE.md updated with invariants.');
}

// 2. Update AGENTS.md
let agents = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\AGENTS.md', 'utf8');
const agentInvariant = `
## 核心业务与排版不可变量 (Core Overwrite & Typography Invariants)

在对 MSDS-Engine 进行重构、修改或新增功能时，以下规范享有系统最高法律效力，严禁违背或弱化：
1. **规格高于代码**：系统以《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》为唯一法定真理源（SOT）；
2. **源码级防篡改封印 (@ANTIGRAVITY_INVARIANT_LOCK)**：凡标注有封印标记的代码块，享有最高只读豁免权，严禁擅自删改；
3. **值格纯左对齐铁律**：所有数据值格强制 \`w:jc val="left"\`，缩进清零，严禁出现两端对齐/分散对齐/居中；
4. **第一列文字垂线对齐**：常规章节 420 dxa，Section 11 565 dxa（11.10 防弹飞），无序号标签右缩进对齐，Section 8 Recommendation 顶格取消缩进；
5. **Section 13 4 行拓扑**：必须保留 2 行独立通栏说明行与 Disposal methods 双居中加粗；
6. **Section 2 分类保护**：规整双列行严禁误触发复合块解耦，禁止将核心 GHS 分类行作为无值行物理删除；
7. **全量 Gate 1~7 自动化质检门禁**：任务打勾必须以测试命令真实退出码 0 与质量断言全绿为充要依据。
`;

if (!agents.includes('## 核心业务与排版不可变量')) {
  agents += agentInvariant;
  fs.writeFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\AGENTS.md', agents, 'utf8');
  console.log('AGENTS.md updated with invariants.');
}
