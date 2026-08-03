# CampusConnect Pro Production Go-Live Checklist

Use this checklist prior to deploying CampusConnect Pro to production environments.

---

## 1. Environment & Secrets
- [ ] `NODE_ENV` is set to `production`.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are replaced with cryptographically secure 256-bit random keys.
- [ ] `MONGODB_URI` connects to a secured, authenticated replica set cluster.
- [ ] `REDIS_URL` or `REDIS_HOST` connects to a production Redis instance with auth enabled.
- [ ] `SENTRY_DSN` is configured for production error capturing.
- [ ] `CORS_ORIGIN` is configured with strict production domain origins (avoiding `*`).

## 2. Infrastructure & Networking
- [ ] Domain TLS/SSL certificate is installed on Nginx reverse proxy / Kubernetes Ingress.
- [ ] Port 3000 is internal-only and not directly exposed to public internet.
- [ ] Rate limiters and DDoS policies are validated in Nginx / Cloudflare.
- [ ] Firewall allows only necessary ports (80, 443).

## 3. Database & Backups
- [ ] Compound Mongoose indexes are generated (`db.events.createIndex(...)`).
- [ ] Automated daily backup cron job (`scripts/backup.sh`) is active and tested with `scripts/restore.sh`.
- [ ] Database connection pool limits fit container memory budget (`maxPoolSize: 10-50`).

## 4. Monitoring & Observability
- [ ] Prometheus scraper targets `/metrics`.
- [ ] Grafana dashboard visualizes HTTP response duration histogram, memory heap, and event loop lag.
- [ ] Health probes `/health/live` and `/health/ready` are bound to Kubernetes pod spec.
