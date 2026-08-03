# Changelog

All notable changes to the CampusConnect Pro enterprise project will be documented in this file.

---

## [1.0.0 Enterprise Upgrade] - 2026-08-03

### Added
- **Enterprise Security Hardening**: Strict Helmet CSP policies, CORS origin controls, rate limiters (Global, Login, OTP, AI, Password Reset), NoSQL injection prevention (`express-mongo-sanitize`), XSS cleaning (`xss-clean`), and HTTP parameter pollution protection.
- **Winston Centralized Logging**: Console and daily rotating file transports (`logs/error.log`, `logs/combined.log`, `logs/exceptions.log`, `logs/rejections.log`).
- **Prometheus Metrics & Observability**: Integration of `prom-client` exposing `/metrics`, `/health`, `/health/live`, `/health/ready` for memory, CPU, HTTP duration, and event loop latency monitoring.
- **Sentry Crash Reporting**: Production error, exception, and promise rejection capturing via `@sentry/node`.
- **Redis & In-Memory Fallback Cache**: Caching service supporting Redis key-value storage with automatic fallback to memory cache.
- **Docker Multi-Stage Setup**: Multi-stage `Dockerfile` and environment-separated `docker-compose.dev.yml` & `docker-compose.prod.yml` running as non-root user `node`.
- **Nginx Reverse Proxy**: Production Nginx configuration with Gzip compression, rate limiting, and SSL termination readiness.
- **CI/CD Pipeline**: GitHub Actions workflow (`ci.yml`) automating linting, dependency audits, testing with MongoDB/Redis services, and Docker build verification.
- **Automated Backup & Restore Scripts**: `scripts/backup.sh` and `scripts/restore.sh` for MongoDB, uploads, logs, and env configs.

### Improved
- Mongoose schema indexing across `User`, `Event`, `Registration`.
- API standardization using `ResponseFormatter` returning `{ success, message, data, errors }`.
- Zod schema validations across all authentication and event routes.
