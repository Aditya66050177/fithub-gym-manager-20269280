# Gym Platform - Microservices Architecture Reference

## Overview

This document describes a service-oriented backend architecture for the Gym Platform, designed for Docker containerization and Kubernetes orchestration.

---

## Project Structure

```
gym-platform-backend/
├── services/
│   ├── identity-service/          # Port 5001
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── authController.ts
│   │   │   │   └── userController.ts
│   │   │   ├── routes/
│   │   │   │   ├── authRoutes.ts
│   │   │   │   └── userRoutes.ts
│   │   │   ├── models/
│   │   │   │   ├── User.ts
│   │   │   │   └── Role.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   └── validationMiddleware.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   └── tokenService.ts
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   └── jwt.ts
│   │   │   ├── utils/
│   │   │   │   └── passwordHash.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── gym-catalog-service/       # Port 5002
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── gymController.ts
│   │   │   │   └── planController.ts
│   │   │   ├── routes/
│   │   │   │   ├── gymRoutes.ts
│   │   │   │   └── planRoutes.ts
│   │   │   ├── models/
│   │   │   │   ├── Gym.ts
│   │   │   │   └── Plan.ts
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.ts
│   │   │   ├── services/
│   │   │   │   ├── gymService.ts
│   │   │   │   └── planService.ts
│   │   │   ├── config/
│   │   │   │   └── database.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── attendance-service/        # Port 5003
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── attendanceController.ts
│   │   │   ├── routes/
│   │   │   │   └── attendanceRoutes.ts
│   │   │   ├── models/
│   │   │   │   └── Attendance.ts
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.ts
│   │   │   ├── services/
│   │   │   │   └── attendanceService.ts
│   │   │   ├── config/
│   │   │   │   └── database.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── notification-service/      # Port 5004
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── emailController.ts
│   │   │   │   └── smsController.ts
│   │   │   ├── routes/
│   │   │   │   └── notificationRoutes.ts
│   │   │   ├── services/
│   │   │   │   ├── emailService.ts
│   │   │   │   └── smsService.ts
│   │   │   ├── templates/
│   │   │   │   ├── welcome.html
│   │   │   │   └── checkin-confirmation.html
│   │   │   ├── queues/
│   │   │   │   └── notificationQueue.ts
│   │   │   ├── config/
│   │   │   │   ├── smtp.ts
│   │   │   │   └── twilio.ts
│   │   │   └── app.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── analytics-service/         # Port 5005
│       ├── src/
│       │   ├── controllers/
│       │   │   ├── dashboardController.ts
│       │   │   └── reportController.ts
│       │   ├── routes/
│       │   │   └── analyticsRoutes.ts
│       │   ├── services/
│       │   │   ├── dashboardService.ts
│       │   │   └── reportService.ts
│       │   ├── aggregators/
│       │   │   ├── attendanceAggregator.ts
│       │   │   └── revenueAggregator.ts
│       │   ├── config/
│       │   │   └── database.ts
│       │   └── app.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
│
├── shared/
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── httpClient.ts
│   │   └── logger.ts
│   └── middleware/
│       └── errorHandler.ts
│
├── k8s/
│   ├── namespaces/
│   │   └── gym-platform.yaml
│   ├── deployments/
│   │   ├── identity-deployment.yaml
│   │   ├── gym-catalog-deployment.yaml
│   │   ├── attendance-deployment.yaml
│   │   ├── notification-deployment.yaml
│   │   └── analytics-deployment.yaml
│   ├── services/
│   │   ├── identity-service.yaml
│   │   ├── gym-catalog-service.yaml
│   │   ├── attendance-service.yaml
│   │   ├── notification-service.yaml
│   │   └── analytics-service.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   ├── secrets/
│   │   └── app-secrets.yaml
│   └── ingress/
│       └── api-ingress.yaml
│
├── docker-compose.yaml
├── docker-compose.dev.yaml
└── README.md
```

---

## Service Responsibilities

### 1. Identity Service (Port 5001)

**Purpose:** Centralized authentication and authorization

**Owns:**
- User accounts
- Roles and permissions
- JWT token management
- Password policies

**Database:** PostgreSQL (identity_db)

**Key Dependencies:**
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- Prisma ORM

---

### 2. Gym Catalog Service (Port 5002)

**Purpose:** Gym and membership plan management

**Owns:**
- Gym profiles
- Pricing plans
- Amenities
- Operating hours

**Database:** PostgreSQL (gym_catalog_db)

**Inter-service Communication:**
- Validates JWT with Identity Service
- Publishes events for Analytics Service

---

### 3. Attendance Service (Port 5003)

**Purpose:** Track member check-ins and check-outs

**Owns:**
- Attendance records
- Session duration tracking
- Daily/weekly attendance logs

**Database:** PostgreSQL (attendance_db)

**Inter-service Communication:**
- Validates JWT with Identity Service
- Fetches gym info from Gym Catalog Service
- Triggers Notification Service on check-in
- Sends data to Analytics Service

---

### 4. Notification Service (Port 5004)

**Purpose:** Handle all outbound communications

**Owns:**
- Email templates
- SMS templates
- Notification logs
- Delivery status tracking

**Database:** PostgreSQL (notification_db)

**External Integrations:**
- SMTP provider (SendGrid, AWS SES)
- SMS provider (Twilio)

**Queue:** Redis/BullMQ for async processing

---

### 5. Analytics Service (Port 5005)

**Purpose:** Aggregate and report platform metrics

**Owns:**
- Pre-computed statistics
- Report configurations
- Dashboard cache

**Database:** PostgreSQL (analytics_db) + Redis (caching)

**Data Sources:**
- Polls Attendance Service for metrics
- Polls Gym Catalog Service for gym data
- Event-driven updates via message queue

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js or Fastify |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Queue | BullMQ |
| Auth | JWT (RS256) |
| Validation | Zod |
| Logging | Pino |
| Container | Docker |
| Orchestration | Kubernetes |

---

## Inter-Service Communication

### Authentication Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  API Gateway     │────▶│ Identity Service│
│             │     │  (validates JWT) │     │   (issues JWT)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐    ┌────────────┐
   │ Gym Catalog│    │ Attendance │    │ Analytics  │
   │  Service   │    │  Service   │    │  Service   │
   └────────────┘    └────────────┘    └────────────┘
```

### JWT Validation Pattern

Each service validates tokens by:
1. Extracting JWT from `Authorization: Bearer <token>`
2. Verifying signature using public key from Identity Service
3. Checking token expiration
4. Extracting user claims (userId, roles)

---

## Database Isolation

Each service has its own database:

```
identity_db         → Users, Roles, RefreshTokens
gym_catalog_db      → Gyms, Plans, Amenities
attendance_db       → Attendances, Sessions
notification_db     → NotificationLogs, Templates
analytics_db        → DashboardStats, Reports
```

**No cross-database queries.** Services communicate via REST APIs.
