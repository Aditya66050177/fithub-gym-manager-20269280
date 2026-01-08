# Docker & Kubernetes Configuration

## Dockerfile Template

Use this template for each microservice:

```dockerfile
# services/identity-service/Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

CMD ["node", "dist/server.js"]
```

---

## Docker Compose (Development)

```yaml
# docker-compose.yaml
version: '3.8'

services:
  # Databases
  identity-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: identity_user
      POSTGRES_PASSWORD: identity_pass
      POSTGRES_DB: identity_db
    volumes:
      - identity-db-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  gym-catalog-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: gym_user
      POSTGRES_PASSWORD: gym_pass
      POSTGRES_DB: gym_catalog_db
    volumes:
      - gym-catalog-db-data:/var/lib/postgresql/data
    ports:
      - "5434:5432"

  attendance-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: attendance_user
      POSTGRES_PASSWORD: attendance_pass
      POSTGRES_DB: attendance_db
    volumes:
      - attendance-db-data:/var/lib/postgresql/data
    ports:
      - "5435:5432"

  notification-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: notification_user
      POSTGRES_PASSWORD: notification_pass
      POSTGRES_DB: notification_db
    volumes:
      - notification-db-data:/var/lib/postgresql/data
    ports:
      - "5436:5432"

  analytics-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: analytics_user
      POSTGRES_PASSWORD: analytics_pass
      POSTGRES_DB: analytics_db
    volumes:
      - analytics-db-data:/var/lib/postgresql/data
    ports:
      - "5437:5432"

  # Redis for caching and queues
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Services
  identity-service:
    build:
      context: ./services/identity-service
      dockerfile: Dockerfile
    ports:
      - "5001:5001"
    environment:
      NODE_ENV: development
      PORT: 5001
      DATABASE_URL: postgresql://identity_user:identity_pass@identity-db:5432/identity_db
      JWT_SECRET: dev-jwt-secret-key-at-least-32-characters
      JWT_REFRESH_SECRET: dev-refresh-secret-key-at-least-32-chars
      REDIS_URL: redis://redis:6379
    depends_on:
      - identity-db
      - redis

  gym-catalog-service:
    build:
      context: ./services/gym-catalog-service
      dockerfile: Dockerfile
    ports:
      - "5002:5002"
    environment:
      NODE_ENV: development
      PORT: 5002
      DATABASE_URL: postgresql://gym_user:gym_pass@gym-catalog-db:5432/gym_catalog_db
      IDENTITY_SERVICE_URL: http://identity-service:5001
      REDIS_URL: redis://redis:6379
    depends_on:
      - gym-catalog-db
      - identity-service
      - redis

  attendance-service:
    build:
      context: ./services/attendance-service
      dockerfile: Dockerfile
    ports:
      - "5003:5003"
    environment:
      NODE_ENV: development
      PORT: 5003
      DATABASE_URL: postgresql://attendance_user:attendance_pass@attendance-db:5432/attendance_db
      IDENTITY_SERVICE_URL: http://identity-service:5001
      GYM_CATALOG_SERVICE_URL: http://gym-catalog-service:5002
      NOTIFICATION_SERVICE_URL: http://notification-service:5004
      REDIS_URL: redis://redis:6379
    depends_on:
      - attendance-db
      - identity-service
      - gym-catalog-service
      - redis

  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    ports:
      - "5004:5004"
    environment:
      NODE_ENV: development
      PORT: 5004
      DATABASE_URL: postgresql://notification_user:notification_pass@notification-db:5432/notification_db
      IDENTITY_SERVICE_URL: http://identity-service:5001
      REDIS_URL: redis://redis:6379
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
    depends_on:
      - notification-db
      - identity-service
      - redis

  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile
    ports:
      - "5005:5005"
    environment:
      NODE_ENV: development
      PORT: 5005
      DATABASE_URL: postgresql://analytics_user:analytics_pass@analytics-db:5432/analytics_db
      IDENTITY_SERVICE_URL: http://identity-service:5001
      ATTENDANCE_SERVICE_URL: http://attendance-service:5003
      GYM_CATALOG_SERVICE_URL: http://gym-catalog-service:5002
      REDIS_URL: redis://redis:6379
    depends_on:
      - analytics-db
      - identity-service
      - attendance-service
      - gym-catalog-service
      - redis

  # Development tools
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  identity-db-data:
  gym-catalog-db-data:
  attendance-db-data:
  notification-db-data:
  analytics-db-data:
  redis-data:
```

---

## Kubernetes Manifests

### Namespace

```yaml
# k8s/namespaces/gym-platform.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: gym-platform
  labels:
    app.kubernetes.io/name: gym-platform
```

---

### ConfigMap

```yaml
# k8s/configmaps/app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: gym-platform
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  IDENTITY_SERVICE_URL: "http://identity-service:5001"
  GYM_CATALOG_SERVICE_URL: "http://gym-catalog-service:5002"
  ATTENDANCE_SERVICE_URL: "http://attendance-service:5003"
  NOTIFICATION_SERVICE_URL: "http://notification-service:5004"
  ANALYTICS_SERVICE_URL: "http://analytics-service:5005"
  REDIS_URL: "redis://redis:6379"
```

---

### Secrets

```yaml
# k8s/secrets/app-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: gym-platform
type: Opaque
stringData:
  JWT_SECRET: "your-production-jwt-secret-minimum-32-characters"
  JWT_REFRESH_SECRET: "your-production-refresh-secret-minimum-32-chars"
  IDENTITY_DB_URL: "postgresql://user:pass@identity-db-host:5432/identity_db"
  GYM_CATALOG_DB_URL: "postgresql://user:pass@gym-db-host:5432/gym_catalog_db"
  ATTENDANCE_DB_URL: "postgresql://user:pass@attendance-db-host:5432/attendance_db"
  NOTIFICATION_DB_URL: "postgresql://user:pass@notification-db-host:5432/notification_db"
  ANALYTICS_DB_URL: "postgresql://user:pass@analytics-db-host:5432/analytics_db"
  SMTP_USER: "apikey"
  SMTP_PASS: "your-sendgrid-api-key"
  TWILIO_ACCOUNT_SID: "your-twilio-sid"
  TWILIO_AUTH_TOKEN: "your-twilio-token"
```

---

### Identity Service Deployment

```yaml
# k8s/deployments/identity-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: identity-service
  namespace: gym-platform
  labels:
    app: identity-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: identity-service
  template:
    metadata:
      labels:
        app: identity-service
    spec:
      containers:
        - name: identity-service
          image: your-registry/identity-service:latest
          ports:
            - containerPort: 5001
          envFrom:
            - configMapRef:
                name: app-config
          env:
            - name: PORT
              value: "5001"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: IDENTITY_DB_URL
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: JWT_SECRET
            - name: JWT_REFRESH_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: JWT_REFRESH_SECRET
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 5
            periodSeconds: 5
---
# k8s/services/identity-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: identity-service
  namespace: gym-platform
spec:
  selector:
    app: identity-service
  ports:
    - protocol: TCP
      port: 5001
      targetPort: 5001
  type: ClusterIP
```

---

### Gym Catalog Service Deployment

```yaml
# k8s/deployments/gym-catalog-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gym-catalog-service
  namespace: gym-platform
  labels:
    app: gym-catalog-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gym-catalog-service
  template:
    metadata:
      labels:
        app: gym-catalog-service
    spec:
      containers:
        - name: gym-catalog-service
          image: your-registry/gym-catalog-service:latest
          ports:
            - containerPort: 5002
          envFrom:
            - configMapRef:
                name: app-config
          env:
            - name: PORT
              value: "5002"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: GYM_CATALOG_DB_URL
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5002
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5002
            initialDelaySeconds: 5
            periodSeconds: 5
---
# k8s/services/gym-catalog-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: gym-catalog-service
  namespace: gym-platform
spec:
  selector:
    app: gym-catalog-service
  ports:
    - protocol: TCP
      port: 5002
      targetPort: 5002
  type: ClusterIP
```

---

### Attendance Service Deployment

```yaml
# k8s/deployments/attendance-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: attendance-service
  namespace: gym-platform
  labels:
    app: attendance-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: attendance-service
  template:
    metadata:
      labels:
        app: attendance-service
    spec:
      containers:
        - name: attendance-service
          image: your-registry/attendance-service:latest
          ports:
            - containerPort: 5003
          envFrom:
            - configMapRef:
                name: app-config
          env:
            - name: PORT
              value: "5003"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: ATTENDANCE_DB_URL
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5003
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5003
            initialDelaySeconds: 5
            periodSeconds: 5
---
# k8s/services/attendance-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: attendance-service
  namespace: gym-platform
spec:
  selector:
    app: attendance-service
  ports:
    - protocol: TCP
      port: 5003
      targetPort: 5003
  type: ClusterIP
```

---

### Notification Service Deployment

```yaml
# k8s/deployments/notification-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: gym-platform
  labels:
    app: notification-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
        - name: notification-service
          image: your-registry/notification-service:latest
          ports:
            - containerPort: 5004
          envFrom:
            - configMapRef:
                name: app-config
          env:
            - name: PORT
              value: "5004"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: NOTIFICATION_DB_URL
            - name: SMTP_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: SMTP_USER
            - name: SMTP_PASS
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: SMTP_PASS
            - name: TWILIO_ACCOUNT_SID
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: TWILIO_ACCOUNT_SID
            - name: TWILIO_AUTH_TOKEN
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: TWILIO_AUTH_TOKEN
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5004
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5004
            initialDelaySeconds: 5
            periodSeconds: 5
---
# k8s/services/notification-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: notification-service
  namespace: gym-platform
spec:
  selector:
    app: notification-service
  ports:
    - protocol: TCP
      port: 5004
      targetPort: 5004
  type: ClusterIP
```

---

### Analytics Service Deployment

```yaml
# k8s/deployments/analytics-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
  namespace: gym-platform
  labels:
    app: analytics-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
        - name: analytics-service
          image: your-registry/analytics-service:latest
          ports:
            - containerPort: 5005
          envFrom:
            - configMapRef:
                name: app-config
          env:
            - name: PORT
              value: "5005"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: ANALYTICS_DB_URL
          resources:
            requests:
              memory: "512Mi"
              cpu: "200m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5005
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5005
            initialDelaySeconds: 5
            periodSeconds: 5
---
# k8s/services/analytics-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: analytics-service
  namespace: gym-platform
spec:
  selector:
    app: analytics-service
  ports:
    - protocol: TCP
      port: 5005
      targetPort: 5005
  type: ClusterIP
```

---

### Ingress (API Gateway)

```yaml
# k8s/ingress/api-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: gym-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.gymplatform.com
      secretName: api-tls-secret
  rules:
    - host: api.gymplatform.com
      http:
        paths:
          - path: /auth(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: identity-service
                port:
                  number: 5001
          - path: /gyms(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: gym-catalog-service
                port:
                  number: 5002
          - path: /attendance(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: attendance-service
                port:
                  number: 5003
          - path: /notify(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: notification-service
                port:
                  number: 5004
          - path: /analytics(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: analytics-service
                port:
                  number: 5005
```

---

## Deployment Commands

```bash
# Build all images
docker-compose build

# Run locally with Docker Compose
docker-compose up -d

# Apply Kubernetes manifests
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/

# Check deployment status
kubectl get pods -n gym-platform
kubectl get services -n gym-platform

# View logs
kubectl logs -f deployment/identity-service -n gym-platform

# Scale a service
kubectl scale deployment/gym-catalog-service --replicas=3 -n gym-platform
```
