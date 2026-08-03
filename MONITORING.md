# CampusConnect Pro Monitoring & Observability

CampusConnect Pro features comprehensive built-in monitoring endpoints powered by `prom-client` for Prometheus scraper integration and health probes.

---

## 1. Monitoring Endpoints

| Endpoint | Purpose | Target / Consumer |
| --- | --- | --- |
| `/metrics` | Exposes Prometheus format system metrics (CPU, Memory, Request Duration, Event Loop Lag) | Prometheus Scraper / Grafana |
| `/health` | Full operational report including uptime, DB connection status, memory breakdown | Load Balancers / Admin Dashboard |
| `/health/live` | Kubernetes Liveness Probe (Returns HTTP 200 UP) | K8s / Docker Healthcheck |
| `/health/ready` | Kubernetes Readiness Probe (Validates active DB connection) | K8s / Docker Ingress |

---

## 2. Prom-Client Key Metrics

- `campusconnect_http_request_duration_seconds`: Histogram measuring endpoint duration broken down by `method`, `route`, and status `code`.
- `campusconnect_process_cpu_seconds_total`: Total CPU time consumed.
- `campusconnect_nodejs_heap_size_total_bytes`: Process heap memory allocation.
- `campusconnect_nodejs_eventloop_lag_seconds`: Event loop delay detection.
