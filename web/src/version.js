export const APP_VERSION = '1.5.0';
export const APP_BUILD_DATE = '2026-10-11';
export const APP_CODENAME = 'Configurable Cell Permissions & Multi-Template Alignment v1.5.0';

export const RELEASE_NOTES = [
  {
    title: '全局值格编辑权限自由管控 (特殊情况配置模式)',
    desc: '新增全局“特殊情况：配置值格编辑权限”控制开关。开启后，编辑器内所有单元格显式挂载电气翡翠绿/低噪灰切换徽标（[🔓 可填] 与 [🔒 锁定]），支持用户一键反转任意单元格的编辑权限并持久记忆覆盖，彻底打破静态规则限制。',
  },
  {
    title: 'EN 英文模板 Section 1 空值格可填适配',
    desc: '消除前端渲染层对空值格的错误拦截，使英文模板 Section 1「1.1 Product name：」等空容器单元格开箱即用支持聚焦输入，并无缝将输入内容写入底层 DOCX XML。',
  },
  {
    title: '模板切换联动与原版式预览器升级',
    desc: '修复编辑器顶栏 #template-select 下拉框切换模板时的动态加载机制，模板重载时自动安全重置局部覆盖缓存；支持在真实源文档与模板效果之间平滑切换与缩放。',
  },
  {
    title: '自动化测试套件与 Ground Truth 基线强化',
    desc: '沉淀 test_cell_editability.mjs 覆盖单元格权限配置与 DOCX 二进制回写校验；test_matching_gt.mjs 16 节 116 项 Ground Truth 对齐测试保持 100% 通过（0 失败）。',
  },
  {
    title: '智能匹配 20 项审阅批注闭环优化',
    desc: '重构防范说明 P 码提取算法（完整保全 P405/P501）、Section 9 法定 24 项全槽位保留并规范填充“无数据资料。”、消除 pH 标签叠词、Section 8 建议行保全与前缀清洗。',
  },
  {
    title: '模板编辑器回填映射引擎同步强化',
    desc: 'Section 11 经口/吸入/经皮急性毒性（LD50/LC50）精准分流映射至第二列二级子标签槽位并杜绝大项覆盖；Section 11 标签根据原文自适应改写为“主要粘膜刺激性”；致敏性试验前缀自动补全；生殖毒性与 STOT 法定项目保留；Section 12 组分生态毒理承接语保全与水生生物分流。',
  },
  {
    title: '底层 DOCX 引擎排版与权限增强',
    desc: '新增 setCellAlignment 支持并在 XML 层面真正注入 w:jc center 节点，彻底解决 Section 3 组分表格居中排版丢失问题；放行 Section 11 特殊标签自适应微调权限。',
  },
];

export const UPDATE_COMMANDS = {
  docker: 'git pull && docker compose build && docker compose up -d',
  windows: 'powershell -ExecutionPolicy Bypass -File scripts/update.ps1',
  linux: 'bash scripts/update.sh',
  submodule: 'git submodule update --remote --merge',
};
