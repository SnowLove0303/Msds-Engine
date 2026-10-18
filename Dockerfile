# ==========================================
# MSDS Engine - Multi-Stage Production Dockerfile (v1.5.0)
#
# PDF 转换策略：镜像自带转换运行时 + 文档实际使用的中文字体。
#
# 为什么必须带"原字体"：
#   容器内若用度量不同的替代字体渲染中文，换行点会改变、分页随之漂移。
#   实测同一份 PU-303C 金标样本：
#     替代字体（Noto CJK）→ 12 页（与 Word 不一致）
#     原字体（宋体/黑体/楷体）→ 7 页（与 Word 金标完全一致）
#   因此镜像在构建期装入原字体，而不是只装替代字体。
#
# 字体为微软专有字体，不进版本库（见 .gitignore），仅在本机构建镜像时由
# docker/fonts/ 提供；请勿把包含这些字体的镜像对外分发。
# ==========================================

# 阶段一：构建前端 SPA (Node 22 编译环境)
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# 先复制依赖文件并安装依赖 (利用 Docker 缓存层)
COPY web/package*.json ./web/
RUN cd web && npm install

# 复制全量源代码
COPY . .

# 编译生成 web/dist
RUN cd web && npm run build

# ==========================================
# 阶段二：生产运行环境（Node 22 原生支持 node:sqlite + 自带转换运行时与字体）
# ==========================================
FROM node:22-bookworm-slim AS runner

# libreoffice-writer → DOCX→PDF 实际转换器（提供 writer_pdf_Export 过滤器）
# fonts-liberation   → Arial / Times New Roman 的度量兼容替代
# fontconfig         → 承载下方确定性字体映射
# poppler-utils      → 保真度回归所需（pdfinfo / pdftotext），不参与生产转换
RUN printf 'Acquire::Retries "5";\nAcquire::http::Pipeline-Depth "0";\nAcquire::http::No-Cache "true";\n' > /etc/apt/apt.conf.d/99-custom \
 && sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
 && apt-get update \
 && (apt-get install -y --no-install-recommends \
      libreoffice-writer \
      fonts-liberation \
      fontconfig \
      poppler-utils \
  || (sleep 2 && apt-get install -y --fix-missing --no-install-recommends \
      libreoffice-writer \
      fonts-liberation \
      fontconfig \
      poppler-utils)) \
 && rm -rf /var/lib/apt/lists/*

# 交付物自带的原中文字体（宋体/黑体/楷体/仿宋/雅黑），随内部镜像分发
COPY docker/fonts/ /usr/share/fonts/truetype/delivery/

# 确定性字体映射：字体名归一 + 西文度量替代 + 中文兜底
COPY docker/fontconfig-local.conf /etc/fonts/local.conf
RUN fc-cache -f

WORKDIR /app/web

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0
# 固定 LibreOffice 用户配置目录，使同一输入在同一运行时下的导出可复现
ENV MSDS_PDF_PROFILE_DIR=/opt/msds-pdf-profile
# 把镜像自带的 LibreOffice 声明为"交付物内置运行时"，使能力标签如实反映来源
ENV MSDS_PDF_BUNDLED_DIR=/usr/lib/libreoffice
ENV HOME=/root

# 复制依赖配置并安装生产所需全部依赖 (包含 jsdom / xmldom)
COPY web/package*.json ./
RUN npm install

# 复制前端编译产物与后端核心代码
COPY --from=builder /app/web/dist ./dist
COPY web/src ./src
COPY web/public ./public
COPY web/data ./data
COPY web/tests ./tests
COPY web/server.mjs ./server.mjs

# 构建期预热：用固定 profile 目录跑一次真实转换，
# 消除首次请求承担 profile 初始化的额外延迟（并作为镜像自检）。
RUN mkdir -p /opt/msds-pdf-profile /tmp/msds-warmup \
 && cp /app/web/data/docs/REC-PU-1007-1791602172214-tcw.docx /tmp/msds-warmup/warmup.docx \
 && soffice -env:UserInstallation=file:///opt/msds-pdf-profile \
      --headless --norestore --nolockcheck --nodefault --nologo \
      --convert-to pdf:writer_pdf_Export \
      --outdir /tmp/msds-warmup /tmp/msds-warmup/warmup.docx \
 && test -s /tmp/msds-warmup/warmup.pdf \
 && rm -rf /tmp/msds-warmup

EXPOSE 5173

# 容器健康检查（使用 Node 原生 fetch，不依赖镜像内是否带 wget）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5173/api/version').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 启动高效生产服务器
CMD ["node", "server.mjs"]
