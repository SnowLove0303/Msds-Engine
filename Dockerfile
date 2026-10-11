# ==========================================
# MSDS Engine - Multi-Stage Production Dockerfile (v1.4.0)
# ==========================================

# 阶段一：构建前端 SPA (Node 22 编译环境)
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖文件并安装依赖 (利用 Docker 缓存层)
COPY web/package*.json ./web/
RUN cd web && npm install

# 复制全量源代码
COPY . .

# 编译生成 web/dist
RUN cd web && npm run build

# ==========================================
# 阶段二：生产运行环境 (Node 22 原生支持 node:sqlite)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app/web

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# 复制依赖配置并安装生产所需全部依赖 (包含 jsdom / xmldom)
COPY web/package*.json ./
RUN npm install

# 复制前端编译产物与后端核心代码
COPY --from=builder /app/web/dist ./dist
COPY web/src ./src
COPY web/public ./public
COPY web/data ./data
COPY web/server.mjs ./server.mjs

EXPOSE 5173

# 容器健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/api/version || exit 1

# 启动高效生产服务器
CMD ["node", "server.mjs"]
