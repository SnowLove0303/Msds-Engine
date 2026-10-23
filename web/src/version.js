export const APP_VERSION = '5.0.0';
export const APP_BUILD_DATE = '2026-10-23';
export const APP_CODENAME = 'MSDS Unified Overwrite & Typography Standardization v5.0.0';

export const RELEASE_NOTES = [
  {
    title: 'MSDS 中英文覆写排版与数据装配工业级规范 (v5.0.0 SOT) 全量落地',
    desc: '正式发布全系统统一真理源（Single Source of Truth），决定 Web 工作台与 Headless Agent API 导出的双通道一致性，涵盖 16 章节中英文全景覆写矩阵与 7 大质量门禁。',
  },
  {
    title: '全篇值格 100% 纯左对齐与字词大间距根除 (Flush Left Mandate)',
    desc: '彻底清除底模残留的 both 与 distribute 两端/分散对齐，全量强制 w:jc val="left"；采用自然词距断行并清空缩进，全篇 108 个值格段落非左对齐数恒为 0。',
  },
  {
    title: '第一列文字垂线对齐与 Section 11.10 防弹飞 (565 dxa) 几何闭环',
    desc: '确立无序号标签右缩进对齐法则；针对 Section 11 包含 5 字符 11.10 导致制表符跳步弹飞的隐蔽故障，将悬挂缩进放宽至 565 dxa（底模原生规范），文字首字完全垂直对齐。',
  },
  {
    title: 'Section 2.1 GHS 危险性类别防丢失与规整双列行保护',
    desc: '消除规整双列行误入复合解耦引起的假冲突，确保生殖毒性物质 1B（H360）等关键分类事实 100% 写入底模，严禁核心行误删。',
  },
  {
    title: 'Section 13 独立 4 行重构与 Section 8 Recommendation 顶格对齐',
    desc: 'Section 13 顶层规范化拆分为 2 行独立单列通栏说明行 + Disposal methods 水平垂直双居中加粗；Section 8 建议行参照中文版彻底取消缩进。',
  },
  {
    title: '页脚双格绝对对齐与自适应当前最新日期',
    desc: '左格公司型号绝对左对齐，右格 Revision Date 首字母大写绝对右对齐，自动同步为 2026 最新有效时间。',
  },
  {
    title: '自动化 Gate 1~7 质量门禁体系闭环',
    desc: '包含 Section 9 零非法制表位、Section 11 跨列几何保护、英文版 100% 纯英文零中文残留等一票否决断言。',
  },
];

export const UPDATE_COMMANDS = {
  docker: 'git pull && docker compose build && docker compose up -d',
  windows: 'powershell -ExecutionPolicy Bypass -File scripts/update.ps1',
  linux: 'bash scripts/update.sh',
  submodule: 'git submodule update --remote --merge',
};
