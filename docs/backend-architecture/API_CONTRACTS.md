# API Contracts - Gym Platform Microservices

## Base Configuration

All services follow these conventions:

- **Content-Type:** `application/json`
- **Authentication:** `Authorization: Bearer <jwt_token>`
- **Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

- **Success Format:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

## 1. Identity Service (Port 5001)

### Base URL: `http://identity-service:5001/api/v1`

---

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user",
      "createdAt": "2026-01-08T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Errors:**
- `400` - Validation error
- `409` - Email already exists

---

### POST /auth/login

Authenticate user and issue tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account suspended

---

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

### GET /auth/me

Get current user profile. **Requires Auth.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "permissions": ["read:gyms", "write:attendance"],
    "createdAt": "2026-01-08T10:00:00Z"
  }
}
```

---

### POST /auth/logout

Invalidate refresh token. **Requires Auth.**

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /auth/verify

Verify JWT token (used by other services). **Internal API.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "user",
    "permissions": ["read:gyms"]
  }
}
```

---

### GET /users (Admin only)

List all users with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `role` (filter by role)
- `search` (search by name/email)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user",
      "status": "active",
      "createdAt": "2026-01-08T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

---

### PATCH /users/:id/role (Admin only)

Update user role.

**Request:**
```json
{
  "role": "gym_owner"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "gym_owner"
  }
}
```

---

## 2. Gym Catalog Service (Port 5002)

### Base URL: `http://gym-catalog-service:5002/api/v1`

---

### GET /gyms

List gyms with filters.

**Query Parameters:**
- `page`, `limit` - Pagination
- `city` - Filter by city
- `amenities` - Comma-separated amenity IDs
- `minPrice`, `maxPrice` - Price range
- `lat`, `lng`, `radius` - Geo search (km)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "FitLife Gym",
      "slug": "fitlife-gym-downtown",
      "address": "123 Main St",
      "city": "New York",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "imageUrl": "https://...",
      "rating": 4.5,
      "reviewCount": 120,
      "priceRange": {
        "min": 29.99,
        "max": 99.99
      },
      "amenities": ["wifi", "parking", "pool"],
      "isActive": true
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 85 }
  }
}
```

---

### GET /gyms/:id

Get gym details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "FitLife Gym",
    "slug": "fitlife-gym-downtown",
    "description": "Premium fitness center...",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "phone": "+1234567890",
    "email": "contact@fitlife.com",
    "website": "https://fitlife.com",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "images": [
      { "url": "https://...", "alt": "Main entrance" }
    ],
    "amenities": [
      { "id": "wifi", "name": "Free WiFi", "icon": "wifi" },
      { "id": "pool", "name": "Swimming Pool", "icon": "pool" }
    ],
    "operatingHours": {
      "monday": { "open": "06:00", "close": "22:00" },
      "tuesday": { "open": "06:00", "close": "22:00" },
      "sunday": { "open": "08:00", "close": "20:00" }
    },
    "plans": [
      {
        "id": "uuid",
        "name": "Monthly",
        "durationMonths": 1,
        "price": 49.99,
        "features": ["Full gym access", "Group classes"]
      }
    ],
    "rating": 4.5,
    "reviewCount": 120,
    "ownerId": "uuid",
    "createdAt": "2026-01-08T10:00:00Z"
  }
}
```

---

### POST /gyms (Gym Owner)

Create a new gym.

**Request:**
```json
{
  "name": "PowerFit Gym",
  "description": "State-of-the-art fitness facility",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "phone": "+1987654321",
  "email": "info@powerfit.com",
  "location": {
    "lat": 34.0522,
    "lng": -118.2437
  },
  "amenities": ["wifi", "parking", "sauna"],
  "operatingHours": {
    "monday": { "open": "05:00", "close": "23:00" }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "PowerFit Gym",
    "slug": "powerfit-gym-los-angeles",
    "ownerId": "uuid",
    "createdAt": "2026-01-08T10:00:00Z"
  }
}
```

---

### PUT /gyms/:id (Gym Owner)

Update gym details.

---

### DELETE /gyms/:id (Gym Owner/Admin)

Soft delete a gym.

---

### GET /gyms/:gymId/plans

List plans for a gym.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "gymId": "uuid",
      "name": "Monthly Membership",
      "durationMonths": 1,
      "price": 49.99,
      "features": ["Full gym access", "Locker room", "Group classes"],
      "isActive": true,
      "createdAt": "2026-01-08T10:00:00Z"
    },
    {
      "id": "uuid",
      "gymId": "uuid",
      "name": "Annual Membership",
      "durationMonths": 12,
      "price": 449.99,
      "features": ["Full gym access", "Personal trainer session", "Spa access"],
      "isActive": true
    }
  ]
}
```

---

### POST /gyms/:gymId/plans (Gym Owner)

Create a membership plan.

**Request:**
```json
{
  "name": "Quarterly Membership",
  "durationMonths": 3,
  "price": 129.99,
  "features": ["Full gym access", "Group classes", "Nutrition consultation"]
}
```

---

## 3. Attendance Service (Port 5003)

### Base URL: `http://attendance-service:5003/api/v1`

---

### POST /attendance/checkin

Record user check-in. **Requires Auth.**

**Request:**
```json
{
  "gymId": "uuid",
  "membershipId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "gymId": "uuid",
    "checkInTime": "2026-01-08T10:00:00Z",
    "status": "checked_in"
  }
}
```

**Errors:**
- `400` - Already checked in
- `403` - Membership expired/invalid

---

### POST /attendance/checkout

Record user check-out. **Requires Auth.**

**Request:**
```json
{
  "attendanceId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "checkInTime": "2026-01-08T10:00:00Z",
    "checkOutTime": "2026-01-08T11:30:00Z",
    "duration": 90,
    "status": "completed"
  }
}
```

---

### GET /attendance/history

Get user's attendance history. **Requires Auth.**

**Query Parameters:**
- `page`, `limit` - Pagination
- `gymId` - Filter by gym
- `startDate`, `endDate` - Date range

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "gymId": "uuid",
      "gymName": "FitLife Gym",
      "checkInTime": "2026-01-08T10:00:00Z",
      "checkOutTime": "2026-01-08T11:30:00Z",
      "duration": 90,
      "status": "completed"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 45 }
  }
}
```

---

### GET /attendance/gym/:gymId/today (Gym Owner)

Get today's attendance for a gym.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gymId": "uuid",
    "date": "2026-01-08",
    "totalCheckIns": 85,
    "currentlyInGym": 23,
    "records": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userName": "John Doe",
        "checkInTime": "2026-01-08T06:30:00Z",
        "checkOutTime": null,
        "status": "checked_in"
      }
    ]
  }
}
```

---

### GET /attendance/stats (Internal API)

Get attendance statistics for analytics.

**Query Parameters:**
- `gymId` - Filter by gym
- `startDate`, `endDate` - Date range
- `aggregation` - daily, weekly, monthly

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalVisits": 1250,
    "uniqueVisitors": 340,
    "averageDuration": 72,
    "peakHours": [
      { "hour": 7, "visits": 89 },
      { "hour": 18, "visits": 145 }
    ],
    "dailyTrend": [
      { "date": "2026-01-01", "visits": 45 },
      { "date": "2026-01-02", "visits": 52 }
    ]
  }
}
```

---

## 4. Notification Service (Port 5004)

### Base URL: `http://notification-service:5004/api/v1`

---

### POST /notify/email

Send email notification. **Internal API / Service-to-Service.**

**Request:**
```json
{
  "to": "user@example.com",
  "template": "welcome",
  "data": {
    "userName": "John Doe",
    "gymName": "FitLife Gym"
  },
  "priority": "normal"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "status": "queued",
    "estimatedDelivery": "2026-01-08T10:00:05Z"
  }
}
```

---

### POST /notify/sms

Send SMS notification. **Internal API.**

**Request:**
```json
{
  "to": "+1234567890",
  "template": "checkin_confirmation",
  "data": {
    "gymName": "FitLife Gym",
    "time": "10:00 AM"
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "status": "queued"
  }
}
```

---

### POST /notify/bulk

Send bulk notifications. **Admin only.**

**Request:**
```json
{
  "channel": "email",
  "template": "promotion",
  "recipients": ["user1@example.com", "user2@example.com"],
  "data": {
    "promoCode": "NEWYEAR2026",
    "discount": "20%"
  },
  "scheduledFor": "2026-01-10T09:00:00Z"
}
```

---

### GET /notify/status/:notificationId

Check notification delivery status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channel": "email",
    "recipient": "user@example.com",
    "status": "delivered",
    "sentAt": "2026-01-08T10:00:02Z",
    "deliveredAt": "2026-01-08T10:00:05Z"
  }
}
```

---

### Available Templates

| Template ID | Channel | Description |
|-------------|---------|-------------|
| `welcome` | email | New user welcome |
| `checkin_confirmation` | email, sms | Check-in confirmed |
| `checkout_summary` | email | Session summary |
| `membership_expiring` | email, sms | Expiration reminder |
| `password_reset` | email | Password reset link |
| `promotion` | email | Marketing promotions |

---

## 5. Analytics Service (Port 5005)

### Base URL: `http://analytics-service:5005/api/v1`

---

### GET /analytics/dashboard

Get dashboard overview. **Requires Auth (Owner/Admin).**

**Query Parameters:**
- `gymId` - Specific gym (owners see only their gyms)
- `period` - today, week, month, year

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "overview": {
      "totalMembers": 1250,
      "activeMembers": 890,
      "newMembers": 45,
      "memberGrowth": 3.6
    },
    "attendance": {
      "totalVisits": 3420,
      "averageDaily": 114,
      "peakDay": "Monday",
      "peakHour": "18:00"
    },
    "revenue": {
      "total": 45890.50,
      "growth": 8.2,
      "byPlan": [
        { "plan": "Monthly", "amount": 25400 },
        { "plan": "Annual", "amount": 20490.50 }
      ]
    },
    "topGyms": [
      { "id": "uuid", "name": "FitLife Downtown", "visits": 1200 }
    ]
  }
}
```

---

### GET /analytics/reports/attendance

Detailed attendance report.

**Query Parameters:**
- `gymId` - Filter by gym
- `startDate`, `endDate` - Date range
- `format` - json, csv

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVisits": 3420,
      "uniqueMembers": 450,
      "averageDuration": 68,
      "returnRate": 72.5
    },
    "hourlyDistribution": [
      { "hour": 6, "visits": 120, "percentage": 3.5 },
      { "hour": 7, "visits": 280, "percentage": 8.2 }
    ],
    "dailyDistribution": [
      { "day": "Monday", "visits": 580, "percentage": 17 },
      { "day": "Tuesday", "visits": 520, "percentage": 15.2 }
    ],
    "trends": [
      { "date": "2026-01-01", "visits": 98 },
      { "date": "2026-01-02", "visits": 112 }
    ]
  }
}
```

---

### GET /analytics/reports/revenue

Revenue analytics report. **Admin only.**

**Query Parameters:**
- `gymId` - Filter by gym
- `startDate`, `endDate` - Date range
- `groupBy` - day, week, month

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 145890.50,
      "averagePerMember": 116.71,
      "topPlan": "Annual Membership",
      "conversionRate": 12.5
    },
    "byPlan": [
      {
        "planId": "uuid",
        "planName": "Monthly",
        "subscriptions": 520,
        "revenue": 25948.80,
        "percentage": 17.8
      }
    ],
    "byGym": [
      {
        "gymId": "uuid",
        "gymName": "FitLife Downtown",
        "revenue": 45200,
        "memberCount": 380
      }
    ],
    "trends": [
      { "period": "2026-01", "revenue": 48500 }
    ]
  }
}
```

---

### GET /analytics/reports/members

Member analytics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "demographics": {
      "ageGroups": [
        { "range": "18-25", "count": 180, "percentage": 14.4 },
        { "range": "26-35", "count": 420, "percentage": 33.6 }
      ]
    },
    "retention": {
      "rate": 78.5,
      "churnRate": 21.5,
      "averageLifetime": 8.2
    },
    "acquisition": {
      "sources": [
        { "source": "referral", "count": 120, "percentage": 45 },
        { "source": "organic", "count": 80, "percentage": 30 }
      ]
    }
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing/invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service unavailable |
