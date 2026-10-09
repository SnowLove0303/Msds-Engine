export const APP_VERSION = '1.3.0';
export const APP_BUILD_DATE = '2026-10-09';
export const APP_CODENAME = 'Precision Match & Review';

export const RELEASE_NOTES = [
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
  {
    title: '预设管理中心全量删除与单入口归一',
    desc: '顶栏精简为单一专属【⚙ 管理预设】入口，上线全量预设删除（支持删除默认预设以外的所有用户自定义预设）、支持批量清空与确认门禁。',
  },
  {
    title: '原版式阅览器滚动稳定与批注门禁优化',
    desc: '原版式阅览器支持章节切换平滑对齐与滚动位置保全，彻底解决下滑弹顶问题；审阅批注抽屉提供“一键清空全部批注”与正式文档导出临时放行开关。',
  },
];

export const UPDATE_COMMANDS = {
  docker: 'git pull && docker compose build && docker compose up -d',
  windows: 'powershell -ExecutionPolicy Bypass -File scripts/update.ps1',
  linux: 'bash scripts/update.sh',
};
