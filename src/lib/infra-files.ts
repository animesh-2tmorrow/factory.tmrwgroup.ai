export const infraFiles = {
  terraform: `module "venture" {
  source = "./modules/ecs-venture"

  name        = var.venture_name
  domain      = "\${var.venture_name}.tmrwgroup.ai"
  environment = var.environment

  # ECS
  cluster_arn   = aws_ecs_cluster.tmrw.arn
  cpu           = 256
  memory        = 512
  desired_count = var.environment == "production" ? 2 : 1
  max_count     = 10

  # Auto-scaling
  cpu_target    = 70
  memory_target = 80

  # ALB
  alb_arn           = aws_lb.tmrw.arn
  listener_arn      = aws_lb_listener.https.arn
  health_check_path = "/health"

  # Database
  db_schema    = "\${var.venture_name}_db"
  rds_cluster  = aws_rds_cluster.tmrw.id

  # Services
  ses_domain   = "tmrwgroup.ai"
  route53_zone = aws_route53_zone.tmrw.id
  acm_cert_arn = aws_acm_certificate.wildcard.arn

  # Payments
  stripe_enabled = true
}`,

  dockerfile: `# Multi-stage build for Next.js on ECS
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \\
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]`,

  githubActions: `name: Deploy to ECS
on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: tmrw-\${{ github.event.repository.name }}
  ECS_CLUSTER: tmrw-ventures
  ECS_SERVICE: \${{ github.event.repository.name }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: \${{ steps.ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \\
            --cluster $ECS_CLUSTER \\
            --service $ECS_SERVICE \\
            --force-new-deployment`,

  makefile: `.PHONY: dev build test lint deploy-staging deploy-prod ecs-status logs scale rollback clean

VENTURE_NAME := $(shell basename $(CURDIR))
ECS_CLUSTER  := tmrw-ventures
ECS_SERVICE  := $(VENTURE_NAME)
AWS_REGION   := us-east-1

dev:
\tdocker-compose up --build

build:
\tdocker build -t $(VENTURE_NAME) .

test:
\tnpm test

lint:
\tnpm run lint && npx tsc --noEmit

deploy-staging:
\t@echo "Deploying $(VENTURE_NAME) to staging..."
\taws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE)-staging --force-new-deployment --region $(AWS_REGION)
\t@echo "Waiting for stable..."
\taws ecs wait services-stable --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE)-staging --region $(AWS_REGION)
\t@echo "Staging deploy complete."

deploy-prod:
\t@read -p "Deploy $(VENTURE_NAME) to PRODUCTION? [y/N] " confirm; \\
\t[ "$$confirm" = "y" ] && \\
\taws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --force-new-deployment --region $(AWS_REGION) && \\
\taws ecs wait services-stable --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) && \\
\techo "Production deploy complete." || echo "Cancelled."

ecs-status:
\taws ecs describe-services --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' --output table

logs:
\taws logs tail /ecs/$(ECS_CLUSTER)/$(ECS_SERVICE) --follow --region $(AWS_REGION)

scale:
\t@read -p "Scale $(VENTURE_NAME) to how many tasks? " count; \\
\taws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --desired-count $$count --region $(AWS_REGION)

rollback:
\t@echo "Rolling back $(VENTURE_NAME)..."
\t@prev=$$(aws ecs describe-services --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) --query 'services[0].deployments[1].taskDefinition' --output text); \\
\taws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --task-definition $$prev --region $(AWS_REGION)
\t@echo "Rolled back."

clean:
\tdocker-compose down -v
\trm -rf node_modules .next`,
};
