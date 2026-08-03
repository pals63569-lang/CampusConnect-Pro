# CampusConnect Pro API Reference

CampusConnect Pro provides a versioned RESTful API mounted under `/api/v1/` with full backward-compatibility mappings under `/api/`.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
- **Description**: Registers a new user account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@campusconnect.edu",
    "password": "SecurePassword123!",
    "role": "Student"
  }
  ```
- **Response**: `201 Created`

### `POST /api/v1/auth/login`
- **Description**: Authenticates user credentials and returns Access + Refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "jane.doe@campusconnect.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`

---

## 2. Event Endpoints

### `GET /api/v1/events`
- **Description**: Fetches list of published events with category filtering, search, and pagination.

### `POST /api/v1/events`
- **Description**: Creates a new event (Requires `Admin` or `Faculty Coordinator` role).

---

## 3. Interactive OpenAPI Documentation

For complete interactive endpoint testing, visit:
- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
