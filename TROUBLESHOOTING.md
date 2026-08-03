# CampusConnect Pro Operational Troubleshooting Guide

This guide details diagnostics and solutions for common production issues.

---

## 1. MongoDB Connection Failures

### Symptom:
`MongooseServerSelectionError: connect ECONNREFUSED`

### Diagnostic Steps:
1. Verify MongoDB process is running: `systemctl status mongod` or `docker ps | grep mongo`.
2. Test network connectivity: `telnet 127.0.0.1 27017` or `nc -zv localhost 27017`.
3. Check `MONGODB_URI` string in `.env`.

---

## 2. Redis Connection Issues / Cache Degraded Mode

### Symptom:
Log warning `BullMQ setup failed (Redis may be offline). Falling back to in-memory processing`

### Diagnostic Steps:
1. CampusConnect Pro is built to gracefully degrade to in-memory cache/queues if Redis is unreachable.
2. To restore full distributed Redis features:
   - Check Redis server status: `redis-cli ping` (should return `PONG`).
   - Verify `REDIS_HOST` and `REDIS_PORT` environment variables.

---

## 3. High CPU / Memory Memory Leak Diagnosis

### Diagnostic Steps:
1. Check Prometheus metrics endpoint: `GET /metrics`.
2. Inspect heap memory allocation: `campusconnect_nodejs_heap_size_total_bytes`.
3. Inspect event loop latency: `campusconnect_nodejs_eventloop_lag_seconds`.
