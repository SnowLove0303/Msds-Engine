# ==========================================
# MSDS Engine - Multi-Stage Production Dockerfile
# ==========================================

# 阶段一：构建前端 SPA
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件并安装依赖 (利用 Docker 缓存层)
COPY web/package*.json ./web/
RUN cd web && npm install

# 复制全量源代码
COPY . .

# 编译生成 web/dist
RUN cd web && npm run build

# ==========================================
# 阶段二：生产运行环境 (轻量精简镜像)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app/web

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# 复制依赖配置并仅安装生产运行依赖
COPY web/package*.json ./
RUN npm install --omit=dev

# 复制前端编译产物与后端核心
COPY --from=builder /app/web/dist ./dist
COPY web/src ./src
COPY web/public ./public
COPY web/server.mjs ./server.mjs

EXPOSE 5173

# 容器健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/api/version || exit 1

# 启动高效生产服务器
CMD ["node", "server.mjs"]
