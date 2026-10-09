export const APP_VERSION = '1.2.0';
export const APP_BUILD_DATE = '2026-10-09';
export const APP_CODENAME = 'Nebula AutoSync';

export const RELEASE_NOTES = [
  {
    title: '预设多版本批量导出阻断彻底修复',
    desc: '移除模态遮罩与卡片冲突事件阻断，修复【✕】、【取消】、【立即导出】按钮及复选框失效问题，优化表单审计结构。',
  },
  {
    title: '预设名称自主掌控与纯净中立体系',
    desc: '横幅支持实时预设重命名，初始预设全部留空继承基准文档，移除所有硬编码企业数据，支持新建、另存与清空覆写。',
  },
  {
    title: '高对比度深邃视觉系统',
    desc: '覆写状态重塑为高对比浅天蓝（对比度 > 12:1），彻底告别黄底白字/白底白字视觉问题。',
  },
  {
    title: '生产级 Docker 容器化支持',
    desc: '提供轻量级多阶段构建 Dockerfile 与 docker-compose.yml，配合零依赖高效生产服务器 server.mjs，一键秒级容器部署。',
  },
  {
    title: '跨平台极速热更新管道',
    desc: '内置 Linux/Docker (scripts/update.sh) 与 Windows (scripts/update.ps1) 极速热更新脚本，Web 控制台提供一键复制命令。',
  },
];

export const UPDATE_COMMANDS = {
  docker: 'git pull && docker compose build && docker compose up -d',
  windows: 'powershell -ExecutionPolicy Bypass -File scripts/update.ps1',
  linux: 'bash scripts/update.sh',
};
