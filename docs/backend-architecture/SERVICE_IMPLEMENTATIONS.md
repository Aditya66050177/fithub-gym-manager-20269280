# Service Implementation Reference

This document provides code patterns and implementation examples for each microservice.

---

## Shared Patterns

### Base Express Application Setup

```typescript
// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'info'
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
});

// Global error handler
app.use(errorHandler);

export { app };
```

---

### Server Entry Point

```typescript
// src/server.ts
import { app } from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5001;

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
}

bootstrap();
```

---

### Database Configuration (Prisma)

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
```

---

### Error Handler Middleware

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({ err, path: req.path }, 'Error occurred');

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

---

## 1. Identity Service Implementation

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  user
  gym_owner
  admin
}

enum UserStatus {
  active
  suspended
  pending_verification
}

model User {
  id              String        @id @default(uuid())
  email           String        @unique
  passwordHash    String
  fullName        String
  phone           String?
  role            Role          @default(user)
  status          UserStatus    @default(pending_verification)
  emailVerified   Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  refreshTokens   RefreshToken[]
}

model RefreshToken {
  id          String   @id @default(uuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}
```

---

### Auth Controller

```typescript
// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  ),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await authService.getUserById(userId);
      
      if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      // Token already validated by middleware
      res.json({
        success: true,
        data: {
          userId: req.user!.id,
          email: req.user!.email,
          role: req.user!.role,
          permissions: req.user!.permissions
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
```

---

### Auth Service

```typescript
// src/services/authService.ts
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { tokenService } from './tokenService';
import { AppError } from '../middleware/errorHandler';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export const authService = {
  async register(data: RegisterData) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Email already registered');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });
    
    // Generate tokens
    const { accessToken, refreshToken, expiresIn } = await tokenService.generateTokenPair(user);
    
    return {
      user,
      accessToken,
      refreshToken,
      expiresIn
    };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }
    
    if (user.status === 'suspended') {
      throw new AppError(403, 'FORBIDDEN', 'Account suspended');
    }
    
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }
    
    const { accessToken, refreshToken, expiresIn } = await tokenService.generateTokenPair(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      accessToken,
      refreshToken,
      expiresIn
    };
  },

  async refreshToken(token: string) {
    return tokenService.refreshAccessToken(token);
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
  }
};
```

---

### Token Service

```typescript
// src/services/tokenService.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export const tokenService = {
  async generateTokenPair(user: { id: string; email: string; role: string }) {
    const permissions = getPermissionsForRole(user.role);
    
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions
    };
    
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600
    };
  },

  async refreshAccessToken(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });
    
    if (!stored) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }
    
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh token expired');
    }
    
    const permissions = getPermissionsForRole(stored.user.role);
    
    const payload: TokenPayload = {
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      permissions
    };
    
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
    
    return {
      accessToken,
      expiresIn: 3600
    };
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
    }
  }
};

function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    user: ['read:gyms', 'write:attendance', 'read:own_profile'],
    gym_owner: ['read:gyms', 'write:gyms', 'read:attendance', 'write:plans', 'read:analytics'],
    admin: ['read:all', 'write:all', 'manage:users']
  };
  
  return permissions[role] || [];
}
```

---

### Auth Middleware

```typescript
// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/tokenService';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing authentication token');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = tokenService.verifyAccessToken(token);
    
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions
    };
    
    next();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }
    
    const hasPermission = requiredPermissions.some(
      perm => req.user!.permissions.includes(perm) || req.user!.permissions.includes('write:all')
    );
    
    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Role not authorized');
    }
    
    next();
  };
}
```

---

## 2. Gym Catalog Service - Key Patterns

### Inter-Service Auth Validation

```typescript
// src/middleware/authMiddleware.ts
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:5001';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing authentication token');
  }
  
  try {
    // Validate token with Identity Service
    const response = await axios.get(`${IDENTITY_SERVICE_URL}/api/v1/auth/verify`, {
      headers: { Authorization: authHeader },
      timeout: 5000
    });
    
    req.user = response.data.data;
    next();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
    }
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Authentication service unavailable');
  }
}
```

---

### Gym Controller Pattern

```typescript
// src/controllers/gymController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { gymService } from '../services/gymService';

const createGymSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  amenities: z.array(z.string()).default([]),
  operatingHours: z.record(z.object({
    open: z.string(),
    close: z.string()
  })).optional()
});

export const gymController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, city, amenities } = req.query;
      
      const result = await gymService.findAll({
        page: Number(page),
        limit: Math.min(Number(limit), 100),
        city: city as string,
        amenities: amenities ? (amenities as string).split(',') : undefined
      });
      
      res.json({
        success: true,
        data: result.data,
        meta: { pagination: result.pagination }
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createGymSchema.parse(req.body);
      const gym = await gymService.create({
        ...data,
        ownerId: req.user!.id
      });
      
      res.status(201).json({
        success: true,
        data: gym
      });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## 3. HTTP Client for Inter-Service Communication

```typescript
// shared/utils/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

interface ServiceConfig {
  baseURL: string;
  timeout?: number;
}

const services: Record<string, ServiceConfig> = {
  identity: {
    baseURL: process.env.IDENTITY_SERVICE_URL || 'http://identity-service:5001',
    timeout: 5000
  },
  gymCatalog: {
    baseURL: process.env.GYM_CATALOG_SERVICE_URL || 'http://gym-catalog-service:5002',
    timeout: 5000
  },
  attendance: {
    baseURL: process.env.ATTENDANCE_SERVICE_URL || 'http://attendance-service:5003',
    timeout: 5000
  },
  notification: {
    baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004',
    timeout: 10000
  },
  analytics: {
    baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:5005',
    timeout: 10000
  }
};

export function createServiceClient(serviceName: keyof typeof services): AxiosInstance {
  const config = services[serviceName];
  
  const client = axios.create({
    baseURL: `${config.baseURL}/api/v1`,
    timeout: config.timeout
  });
  
  // Request interceptor
  client.interceptors.request.use((config) => {
    logger.debug({ service: serviceName, path: config.url }, 'Outbound request');
    return config;
  });
  
  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error({
        service: serviceName,
        path: error.config?.url,
        status: error.response?.status,
        message: error.message
      }, 'Service request failed');
      throw error;
    }
  );
  
  return client;
}

// Usage example:
// const identityClient = createServiceClient('identity');
// const { data } = await identityClient.get('/auth/verify', { headers: { Authorization: token } });
```

---

## Environment Variables Template

```bash
# .env.example (for each service)

# Service Configuration
NODE_ENV=development
PORT=5001
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/identity_db

# JWT (Identity Service only)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-key

# Inter-Service URLs
IDENTITY_SERVICE_URL=http://identity-service:5001
GYM_CATALOG_SERVICE_URL=http://gym-catalog-service:5002
ATTENDANCE_SERVICE_URL=http://attendance-service:5003
NOTIFICATION_SERVICE_URL=http://notification-service:5004
ANALYTICS_SERVICE_URL=http://analytics-service:5005

# Redis (for caching/queues)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Notification Service specific
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```
