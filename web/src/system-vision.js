/**
 * MSDS-Engine 系统核心构建愿景与通用性准则 (Single Source of Truth)
 *
 * 每次 Agent 调用标准工作流或 MCP 工具时，均强制透传本愿景与反硬编码/反情景化准则。
 */

export const SYSTEM_VISION_CORE = Object.freeze({
  vision: '不论源 MSDS 原来长什么样，通过手脚层（无损感知 + 拓扑参数提取 + 万能编辑器原语 + 参数化门禁）的搭建给 Agent，让 Agent 大脑将其内容结构化、标准化；手脚层永远不替 Agent 预设“MSDS 应该长什么样”。',
  universalityPrinciples: [
    '1. 拓扑即参数 (Topology as Parameters): 拓扑识别模块的职责是从任意目标母版中提取结构与排版参数（章节数、网格形态、缩进 dxa、字体字号、边框、插槽）；下游编辑器与审计器只认提取出的 Template Profile，严禁写死 420/560 dxa、80.28pt、16 章节或 Section 2 通栏。',
    '2. 反硬编码与反情景化 (No Hardcoding / No Scenario Overfitting): 严禁写死特定企业预设（如冠志/国彩）、固定 8 格式交付矩阵、固定 5 页或特定产品型号特判。所有企业预设与交付矩阵均为外部可配置参数，可按需增删或置空。',
    '3. 三层正交解耦 (Orthogonal Decoupling): 模板 = 排版拓扑与样式参数源；源文件 = 唯一化学技术事实；企业预设 = 外部个体元数据。',
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
