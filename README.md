# CampusConnect Pro Backend (v1.0.0 Modernized)

CampusConnect Pro is a high-performance, production-ready Express.js backend architecture for smart college event management systems. Built with Node.js, Express.js, MongoDB/Mongoose, Zod validation, JWT authentication with refresh token support, Winston logging, Helmet security, rate limiting, and Swagger/OpenAPI documentation.

---

## Key Architectural & Security Upgrades

- **Versioned API Structure**: `/api/v1/*` routes mounted with full backward compatibility aliases to `/api/*`.
- **Centralized Error Handling**: Unified `AppError` hierarchy, Zod validation error handler, and standard `ApiResponse` format across all endpoints.
- **Request Validation**: Schema-based payload validation (body, query, params) via **Zod** middleware.
- **Security Protections**:
  - `Helmet` HTTP security headers.
  - `Cors` configurable origins.
  - Dual Rate Limiters: General API limit & Stricter Auth limit.
  - NoSQL Injection protection (`express-mongo-sanitize`).
  - Request ID tracing (`X-Request-ID` header).
- **Authentication & Authorization**:
  - Access Token (JWT) + Refresh Token rotation support.
  - Mongoose `pre('save')` automatic password hashing & comparison methods.
  - Role-based authorization (`Super Admin`, `Admin`, `Faculty Coordinator`, `Student`, `Volunteer`).
- **Database Optimization**:
  - Compound indexes on `User`, `Event`, `Registration`.
  - Lean query operations (`.lean()`) for read-heavy operations.
- **Observability & Logging**:
  - `Winston` logger with request ID context, log levels, and file transports (`logs/error.log`, `logs/combined.log`).
  - Production-ready `/health` endpoint returning server uptime, memory stats, and database state.
- **Documentation**: Interactive OpenAPI 3.0 UI mounted at `/api-docs`.
- **Testing & Containerization**:
  - `Jest` + `Supertest` test suite.
  - `Dockerfile` & `docker-compose.yml`.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`).

---

## Directory Structure

```
CampusConnect-Pro/
│
├── config/             # Config modules (env.js, db.js, cloudinary.js, swagger.js)
├── controllers/        # Refactored controller handlers
├── middleware/         # Auth, validation, error, upload, request ID middleware
├── models/             # Mongoose schemas with indexes & hooks
├── public/             # Static web assets & SPA frontend
├── routes/             # Versioned express routes
├── services/           # AI, email, PDF, QR code, and background services
├── tests/              # Jest integration & unit test suite
├── uploads/            # Local uploads fallback directory
├── utils/              # API features, logger, custom errors, Zod validators
├── .env.example        # Environment variables template
├── Dockerfile          # Production container setup
├── docker-compose.yml  # Local multi-container orchestration
├── package.json        # Project dependencies & npm scripts
└── server.js           # Express app initialization & graceful shutdown
```

---

## Environment Configuration Matrix

| Key | Description | Default / Example | Required |
| --- | --- | --- | --- |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` | Yes |
| `PORT` | Server listening port | `3000` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/campusconnect_pro` | Yes |
| `JWT_SECRET` | Secret key for access tokens | `super_secret_jwt_key...` | Yes |
| `JWT_EXPIRES_IN` | Access token lifespan | `7d` | Yes |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | `super_secret_refresh_key...` | Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `30d` | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | Yes |
| `CLOUDINARY_*` | Cloudinary credentials for cloud upload | Optional (local fallback used if empty) | No |
| `EMAIL_*` | SMTP credentials for email delivery | Optional (logged to console if empty) | No |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and adjust keys:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Seed Database
```bash
npm run seed
```

---

## API Documentation

Interactive Swagger documentation is available once the server is running:
- **UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **JSON Spec**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## Running Tests & Code Quality Tools

```bash
# Run unit & integration tests
npm test

# Run ESLint check
npm run lint

# Automatically fix ESLint errors
npm run lint:fix

# Format code with Prettier
npm run format
```

---

## Container Deployment (Docker)

```bash
# Build and start services using Docker Compose
docker-compose up --build -d

# Stop services
docker-compose down
```

---

## TypeScript Migration Roadmap (Feasibility & Strategy)

If converting the project to **TypeScript** in the future:
1. **Phase 1: Setup Infrastructure**:
   - Install `typescript`, `ts-node-dev`, `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/jest`.
   - Add `tsconfig.json` with strict mode (`"strict": true`, `"moduleResolution": "node"`).
2. **Phase 2: Types & Interfaces**:
   - Define interfaces in `src/types/` for `User`, `Event`, `Registration`, `CustomRequest` (extending `express.Request` to include `user` and `id`).
3. **Phase 3: Incremental Conversion**:
   - Convert `config/` and `utils/` to `.ts`.
   - Convert `middleware/` and `models/` using `mongoose.Document` types.
   - Convert `controllers/` and `routes/`.
4. **Phase 4: Build Step**:
   - Configure `"build": "tsc"` to output JavaScript into `dist/`.
   - Run production using `node dist/server.js`.
