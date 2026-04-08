# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-bookworm-slim

# Install a full dev/ops toolkit — no restrictions, like Claude.ai sandbox
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    git \
    jq \
    tree \
    zip \
    unzip \
    python3 \
    python3-pip \
    python3-venv \
    # Networking tools (ping, traceroute, dig, nslookup, netstat, ip, ss)
    iputils-ping \
    traceroute \
    dnsutils \
    net-tools \
    iproute2 \
    # Build tools
    build-essential \
    # Editors
    vim-tiny \
    nano \
    # System tools
    procps \
    htop \
    strace \
    lsof \
    less \
    man-db \
    rsync \
    openssh-client \
    gnupg \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS from build stage
COPY --from=builder /build/dist ./dist

# ─── SECURITY: Non-root agent user ──────────────────────────────────────────
# node:20-bookworm-slim already has UID/GID 1000 as `node`. Reuse that user.
# Workspace is jailed by EFS access point (kernel-level isolation).
RUN mkdir -p /workspace \
    && chown node:node /workspace \
    && chmod 0700 /workspace \
    && chown -R node:node /app

ENV NODE_ENV=production
ENV AGENT_WORKSPACE_ROOT=/workspace
ENV RUNNER_PORT=8787

EXPOSE 8787

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const h=require('http');h.get('http://localhost:8787/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

USER node
CMD ["node", "dist/index.js"]
