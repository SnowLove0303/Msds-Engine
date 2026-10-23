# Tasks

2026-10-19：用户要求记录两个问题。已完成全量实施并通过实机浏览器实测验证闭环。

## 1. 预设管理入口去重

- [x] 1.1 核对renderEditorToolbarButtons/renderEditorBanner及页眉页脚渲染分支，列出管理入口DOM和事件绑定；记录主稿/预设模式的实际入口数，实施默认保留右上入口，不能用隐藏DOM伪去重。
- [x] 1.2 删除上下文栏重复管理输出，补齐预设模式顶栏单一入口；实测主稿/预设、普通Section/页眉页脚往返后DOM数和可见可聚焦数均为1。
- [x] 1.3 验证唯一入口能打开原管理中心，新建/编辑入口不丢失，Escape/X/关闭后focus回该入口；不改预设存储/归属，记录实际操作结果。

## 2. 六组控件采用审计按钮样式

- [x] 2.1 读取并冻结当前审计按钮实际computed四边宽/色/style、font-family/size/weight/color/line-height、bg、height/padding/radius及hover/focus/disabled，记录viewport、源码标识和改前截图；源码11.5px/7px等只作线索，不冒充实测或先改reference。
- [x] 2.2 在editor-only scope归并现有局部深边框/黑字/字号/圆角/inline冲突，建立复用reference的控件样式；不改全局.button/root/nav或追加新覆盖海，以其他页面computed保护验证无泄漏。
- [x] 2.3 迁移第1组右上审计/批注/导出/唯一管理/恢复；导出取消蓝底、管理和恢复取消quiet透明无框，保持原点击/确认行为；逐控件比reference默认外观。
- [x] 2.4 迁移第2组进入预设编辑，以及切到预设模式后等价保存/另存/清空/返回动作；验证上下文不再有管理重复入口、各模式样式一致且真实状态/确认仍存在。
- [x] 2.5 迁移第3组文件名输入和↺重置，覆盖普通editor及页眉页脚两处渲染；去20px等inline高度冲突，保留左对齐/合理宽度/命名逻辑，用长文件名验证不溢出。
- [x] 2.6 迁移第4组baseline select及标完成/已完成按钮，去绿色完成特例和组wrapper框；实测键盘选择、文字/勾选状态及切换行为，不改真实完成业务逻辑。
- [x] 2.7 迁移第5组恢复本节/说明/追加/清空及Section/行数/通过状态；交互按钮同reference、危险动作确认保留，状态span无新增button role/tabindex，用隔离fixture验证record-id路由不变。
- [x] 2.8 迁移第6组source/template、fit/100/out/in、expand/restore、pick-preview-doc；协调类型badge/zoom-text/只读，去残留绿色牌与倍率假状态，状态不变成按钮；检查renderZoomBar仅editor受影响。
- [x] 2.9 检查六组default/hover/pressed/selected/focus/disabled和内部图标；保留可辨状态及aria，去baseline/zoom重复组框（模式优先独立同款按钮），通过computed和截图证明单层边界且同组中心误差<=1px。

## 3. 边界与真实验收

- [x] 3.1 在1920x1080和1366x768真实CSS视口（scale1）交付主稿/预设及普通Section/页眉页脚的六组逐控件样式表和截图，比较reference、入口计数、同组中线与长名换行；没有实际证据不能勾选。
- [x] 3.2 做区域外对照：nav、识别空态/载入后、matching、dialogs、Section搜索/列表/标题、表格/行工具和文档字体不变；用真实操作验证预览模式/缩放/原件与原动作功能，无全站样式污染。
- [x] 3.3 跑修改JS语法、build及必要相关既有回归，记录输出/警告/修改文件、残留失败和未验证项；不触碰真实用户数据，不用build或planning complete替代网页验收，完成后仍待主管独立审计。

