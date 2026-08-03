# CampusConnect Pro Architecture & System Design

CampusConnect Pro is designed following **Clean Architecture** principles, prioritizing modularity, separation of concerns, scalability, and maintainability.

---

## 1. System Overview

```
[ Client / SPA / Mobile ]
         │
         ▼
    [ Nginx Reverse Proxy ]
         │
         ▼
[ Express.js API Layer (app.js) ]
  ├── Security & Rate Limiters
  ├── Prometheus Metrics & Health (/metrics, /health)
  ├── Request Tracing (X-Request-ID)
  └── Winston Centralized Logger
         │
         ▼
  [ Router Layer (/api/v1/*) ]
         │
         ▼
  [ Controller Layer ]
         │
         ▼
  [ Service Layer ]
  ├── EventService, AuthService, AiService, PdfService, QrService
  ├── Redis Caching (CacheService)
  └── BullMQ Queues (Email, Notifications, Reminders)
         │
         ▼
  [ Repository / Model Layer (Mongoose Schemas) ]
         │
         ▼
     [ MongoDB Cluster ]
```

---

## 2. Layer Responsibilities

- **Routes (`src/routes`)**: Maps incoming HTTP endpoints to controllers and applies validation/auth middleware.
- **Controllers (`src/controllers`)**: Manages HTTP request parsing, response formatting, and calls service methods.
- **Services (`src/services`)**: Encapsulates business logic, third-party integrations (Cloudinary, Nodemailer, AI APIs), PDF generation, and caching operations.
- **Repositories & Models (`models/`)**: Mongoose data schemas, compound indexes, hook behaviors, and data access logic.
- **Middlewares (`src/middleware/`)**: Auth verification, role checks, rate limiting, request validation, metrics gathering, error handling.

---

## 3. Asynchronous Task Architecture

Background activities (sending email confirmations, generating event PDF badges, running system cleanups) are processed asynchronously via **BullMQ / Redis queues**:
- `emailQueue`: Dispatches transaction and account verification emails.
- `notificationQueue`: Broadcasts Socket.IO and Push notifications.
- `reminderQueue`: Evaluates event schedules and dispatches reminders to registered students.
