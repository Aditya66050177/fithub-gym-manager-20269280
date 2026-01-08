# Gym Platform - Backend Microservices Architecture

## Overview

This documentation provides a complete reference architecture for building a microservices-based backend for the Gym Platform. The architecture is designed for Docker containerization and Kubernetes orchestration.

> **Note:** This is reference documentation only. The actual implementation must be done in an external development environment with Node.js support.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md) | Complete folder structure, service responsibilities, and technology stack |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | REST API specifications for all services with request/response examples |
| [SERVICE_IMPLEMENTATIONS.md](./SERVICE_IMPLEMENTATIONS.md) | Code patterns, controllers, services, and middleware examples |
| [DOCKER_KUBERNETES.md](./DOCKER_KUBERNETES.md) | Dockerfile templates, Docker Compose, and Kubernetes manifests |

---

## Quick Start (External Environment)

### Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- kubectl (for Kubernetes deployment)

### Local Development

```bash
# Clone and setup
mkdir gym-platform-backend
cd gym-platform-backend

# Create service directories
mkdir -p services/{identity-service,gym-catalog-service,attendance-service,notification-service,analytics-service}
mkdir -p k8s/{namespaces,deployments,services,configmaps,secrets,ingress}
mkdir -p shared/{types,utils,middleware}

# Initialize each service
cd services/identity-service
npm init -y
npm install express typescript prisma @prisma/client bcrypt jsonwebtoken zod pino cors helmet
npm install -D @types/node @types/express @types/bcrypt @types/jsonwebtoken ts-node nodemon

# Repeat for other services...
```

### Service Ports

| Service | Port | Base URL |
|---------|------|----------|
| Identity | 5001 | `/api/v1/auth`, `/api/v1/users` |
| Gym Catalog | 5002 | `/api/v1/gyms`, `/api/v1/plans` |
| Attendance | 5003 | `/api/v1/attendance` |
| Notification | 5004 | `/api/v1/notify` |
| Analytics | 5005 | `/api/v1/analytics` |

---

## Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │    (Ingress)    │
                                    └────────┬────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            │                                │                                │
            ▼                                ▼                                ▼
   ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
   │    Identity     │◄──────────▶│   Gym Catalog   │◄──────────▶│   Attendance    │
   │    Service      │            │     Service     │            │     Service     │
   │   (Port 5001)   │            │   (Port 5002)   │            │   (Port 5003)   │
   └────────┬────────┘            └────────┬────────┘            └────────┬────────┘
            │                              │                              │
            ▼                              ▼                              ▼
   ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
   │   identity_db   │            │ gym_catalog_db  │            │  attendance_db  │
   │   (PostgreSQL)  │            │   (PostgreSQL)  │            │   (PostgreSQL)  │
   └─────────────────┘            └─────────────────┘            └─────────────────┘

            ┌────────────────────────────────┼────────────────────────────────┐
            │                                                                 │
            ▼                                                                 ▼
   ┌─────────────────┐                                            ┌─────────────────┐
   │  Notification   │                                            │    Analytics    │
   │    Service      │                                            │     Service     │
   │   (Port 5004)   │                                            │   (Port 5005)   │
   └────────┬────────┘                                            └────────┬────────┘
            │                                                              │
            ▼                                                              ▼
   ┌─────────────────┐                                            ┌─────────────────┐
   │ notification_db │                                            │  analytics_db   │
   │   (PostgreSQL)  │                                            │   (PostgreSQL)  │
   └─────────────────┘                                            └─────────────────┘

                              ┌─────────────────┐
                              │      Redis      │
                              │  (Cache/Queue)  │
                              └─────────────────┘
```

---

## Key Design Decisions

### 1. Database Per Service
Each service owns its data completely. No shared databases.

### 2. JWT Authentication
- Identity Service issues RS256 signed JWTs
- Other services validate tokens by calling Identity Service's `/auth/verify` endpoint
- Short-lived access tokens (1 hour) + long-lived refresh tokens (7 days)

### 3. Inter-Service Communication
- Synchronous: REST APIs over HTTP
- Future: Consider adding message queue (RabbitMQ/Kafka) for async events

### 4. API Versioning
All endpoints prefixed with `/api/v1` for future compatibility.

### 5. Health Checks
Every service exposes `/health` endpoint for Kubernetes probes.

---

## Security Considerations

- [ ] Use HTTPS in production (TLS termination at Ingress)
- [ ] Store secrets in Kubernetes Secrets or external vault
- [ ] Implement rate limiting at API Gateway
- [ ] Add request tracing (correlation IDs)
- [ ] Validate all inputs with Zod schemas
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Implement proper CORS policies

---

## Frontend Integration

Update the React frontend to consume these APIs:

```typescript
// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.gymplatform.com';

export const api = {
  auth: {
    login: (data) => fetch(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => fetch(`${API_BASE}/auth/register`, { method: 'POST', body: JSON.stringify(data) }),
  },
  gyms: {
    list: (params) => fetch(`${API_BASE}/gyms?${new URLSearchParams(params)}`),
    get: (id) => fetch(`${API_BASE}/gyms/${id}`),
  },
  attendance: {
    checkIn: (data) => fetch(`${API_BASE}/attendance/checkin`, { method: 'POST', body: JSON.stringify(data) }),
  }
};
```

---

## Next Steps

1. Export this documentation from Lovable
2. Set up the project structure in your local environment
3. Implement services following the patterns in SERVICE_IMPLEMENTATIONS.md
4. Run locally with Docker Compose
5. Deploy to Kubernetes cluster

---

## Support

This architecture is designed to be:
- **Scalable** - Each service scales independently
- **Maintainable** - Clear separation of concerns
- **Resilient** - Failure in one service doesn't crash others
- **Observable** - Health checks and logging built-in
