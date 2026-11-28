/**
 * MSDS-Engine 系统核心构建愿景与通用性准则 (Single Source of Truth)
 *
 * 每次 Agent 调用标准工作流或 MCP 工具时，均强制透传本愿景与反硬编码/反情景化准则。
 */

export const SYSTEM_VISION_CORE = Object.freeze({
  vision: '不论源 MSDS 原来长什么样，通过手脚层（无损感知 + 万能编辑器原语 + 确定性门禁）的搭建给 Agent，让 Agent 大脑将其内容结构化、标准化；手脚层永远不替 Agent 预设“MSDS 应该长什么样”。',
  universalityPrinciples: [
    '1. 反硬编码 (No Hardcoding): 严禁在引擎或工作流中写死特定型号（如 if model === "xxx"）、固定章节数（如 1..16）、或特定企业预设（如强制绑定冠志/国彩）。',
    '2. 反情景化 (No Scenario Overfitting): 严禁为了应付某一份特殊源文件而修改通用底层逻辑或编造外生内容；非标结构由 Agent 语义大脑标注或通过可插拔 Rule Pack / 外部 JSON 注入。',
    '3. 三层正交解耦 (Orthogonal Decoupling): 模板 = 排版拓扑骨架（动态识别）；源文件 = 唯一化学技术事实；企业预设 = 外部可配置元数据（按需选择，可为空）。',
    '4. 通道唯一与血缘可追溯 (Canonical Entry & Provenance): 必须通过受控网关/标准 Runner 执行，严禁绕过流程私写 ad-hoc 脚本篡改 DOCX。'
  ]
});

export function formatVisionBanner() {
  return [
    '┌────────────────────────────────────────────────────────────────────────┐',
    '│ 🧭 MSDS-Engine 核心愿景 & 通用性准则 (Agent Mandatory Context)         │',
    '├────────────────────────────────────────────────────────────────────────┤',
    `│ 愿景: ${SYSTEM_VISION_CORE.vision}`,
    ...SYSTEM_VISION_CORE.universalityPrinciples.map(p => `│ ${p}`),
    '└────────────────────────────────────────────────────────────────────────┘'
  ].join('\n');
}

export function getMcpVisionInstructions() {
  return `${SYSTEM_VISION_CORE.vision}\n\n通用性准则:\n${SYSTEM_VISION_CORE.universalityPrinciples.join('\n')}`;
}
