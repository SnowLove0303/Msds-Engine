import fs from 'fs';

const logPath = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\CHANGELOG.md';
let log = fs.readFileSync(logPath, 'utf8');

const newEntry = `## [2026-10-23 下午追加] - 中英文覆写全景大一统规范落地、Section 2.1 分类修复与 Recommendation 对齐

### 核心交付 (Delivered)
1. **全篇值格 100% 纯左对齐与字词大间距根除 (Flush Left Mandate)**：
   - 彻底粉碎底模残留的 \`both\`（两端对齐）与 \`distribute\`（分散对齐），全量强制 \`w:jc val="left"\`；
   - 采用自然词距（Natural Word Spacing）断行，彻底消除了 Word 两端对齐强行拉大英文单词间距与中文字距的恶性排版；
   - 缩进彻底清零（无首行/左缩进），全篇 108 个值格段落自动化断言非左对齐数为 0。
2. **第一列“文字对文字”垂线对齐与 Section 11.10 防弹飞 (565 dxa) 闭环**：
   - 确定无序号标签（如 \`Chemical category:\` / \`GHS Pictograms:\`）强制右缩进对齐法则，首字母与上方有序号标签文字首字母严格垂直对齐；
   - 攻克 \`11.10\`（5 字符宽 452 dxa）超出 420 dxa 导致制表符跳步弹飞的隐蔽故障，将 Section 11 悬挂缩进基准自适应放宽至 \`565 dxa\`（底模原生规范），文字首字母 \`A\` 完美对齐。
3. **英文版 Section 8 Recommendation: 参照中文版取消缩进**：
   - Section 8 中的 \`Recommendation:\`（建议：）参照中文版规范，彻底清除缩进，顶格纯左对齐加粗。
4. **中文版 Section 2 2.1 GHS 危险性类别丢失根治**：
   - 根因定位：解耦算法对规整的双列普通行（非单列、非多标签复合行）误触发复合块解耦，导致 \`2.6 其他危害\` 被错判为分类冲突，使 \`ghs_classification\` 打上 \`REVIEW_AMBIGUOUS\` 并被底模剪枝作为无值行物理删除；
   - 闭环修复：严格限定复合块解耦仅对单单元格行（\`!cell1\`）或多标签复合行生效；针对 \`REVIEW_AMBIGUOUS\` 增加分类优先事实提取门禁，坚决杜绝误删底模核心行；
   - 交付验证：中文版 \`2.1 GHS危险性类别： 生殖毒性物质，类别1B（H360）\` 完璧归赵，后续 \`2.1~2.6\` 序号恢复正常。
5. **发布《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》**：
   - 作为系统决定 Web 编辑器导出与 Agent API 全自动生产的最高法定真理源（Single Source of Truth），实现全量 8 交付物质量闭环。

---
`;

log = log.replace('# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n', '# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n' + newEntry);
fs.writeFileSync(logPath, log, 'utf8');
console.log('CHANGELOG.md updated successfully.');
