# Security Policy & Hardening Guidelines

CampusConnect Pro is built with an enterprise security-first approach to protect sensitive student and faculty data against unauthorized access, session hijacking, data corruption, and service disruption.

---

## 1. Implemented Security Controls

### 1.1 Transport Layer & Security Headers (`helmet`)
- **Strict HTTPS / HSTS**: Enforced via `Strict-Transport-Security` headers with 1-year max-age and subdomains inclusion.
- **Content Security Policy (CSP)**: RESTful endpoints enforce strict script, style, frame, and connect source restrictions.
- **Frameguard & XSS**: Disables embedding inside external `<iframe>` elements (`X-Frame-Options: SAMEORIGIN`) and enables browser XSS filtering.
- **MIME & Referrer Policies**: Prevents MIME-sniffing (`X-Content-Type-Options: nosniff`) and controls referrer leakage (`Referrer-Policy: strict-origin-when-cross-origin`).

### 1.2 Rate Limiting & Denial-of-Service (DoS) Protection
Distinct rate limiting windows and request thresholds are applied per endpoint risk level:
- **Global API Limiter**: 300 requests per 15-minute window per IP.
- **Authentication Limiter**: 10 login/registration requests per 15-minute window per IP.
- **OTP Request Limiter**: 5 OTP requests per 10-minute window per IP.
- **AI Service Limiter**: 15 AI processing requests per minute per IP.
- **Password Reset Limiter**: 5 password reset requests per 15-minute window per IP.

### 1.3 Injection & Sanitization Protections
- **NoSQL Injection**: Express Mongo Sanitize (`express-mongo-sanitize`) strip any user input containing `$` or `.` operators.
- **Cross-Site Scripting (XSS)**: Input payloads are sanitized (`xss-clean`) to strip malicious script tags.
- **Parameter Pollution**: `hpp` protects against HTTP Parameter Pollution attacks on duplicate query keys.

### 1.4 Authentication & Token Security
- **Bcrypt Hashing**: Passwords stored using `bcryptjs` with salt round factor 10.
- **JWT Refresh Tokens & Blacklisting**: Token pair rotation using short-lived Access Tokens (15m-1d) and Refresh Tokens (30d). Revoked tokens are blacklisted in Redis / Cache memory.
- **Session Security**: HTTP-only, `SameSite=Strict`, `Secure` cookies for authentication credentials.

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability in CampusConnect Pro, please report it immediately:

- **Email**: `security@campusconnect.edu`
- **Response SLA**: Vulnerability reports will be acknowledged within 24 hours.
