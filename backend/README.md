# IoT Dashboard API Backend

A secure, clean, and RESTful Django REST Framework (DRF) backend API for managing users, devices, sensor data, and alerts. Features JWT Authentication via `djangorestframework-simplejwt`, CORS support, schema validation, and database search/filtering capabilities.

## 🚀 Tech Stack

- **Framework**: Django & Django REST Framework
- **Authentication**: JWT (JSON Web Tokens via simplejwt)
- **Database**: SQLite (default for development)
- **CORS**: django-cors-headers
- **Filters**: django-filter

---

## 🔒 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new operator account
- `POST /api/auth/login/` - Login and obtain JWT Access & Refresh tokens
- `POST /api/auth/token/refresh/` - Refresh JWT Access token
- `POST /api/auth/logout/` - Revoke and blacklist JWT Refresh token

### Devices (Scoped to Owner)
- `GET /api/devices/` - List devices owned by the authenticated operator
- `POST /api/devices/` - Provision a new device
- `GET /api/devices/<id>/` - Retrieve device details
- `PUT/PATCH /api/devices/<id>/` - Update device specs/status
- `DELETE /api/devices/<id>/` - Decommission/Delete device

### Telemetry / Sensor Data
- `POST /api/sensor-data/` - Log sensor data metrics
- `GET /api/sensor-data/` - View/Filter sensor logs (supports query parameters: `device`, `start_time`, `end_time`, `min_temp`, `max_temp`)

### System Alerts
- `GET /api/alerts/` - View system warning logs
- `PATCH /api/alerts/<id>/` - Acknowledge or resolve an alert

---

## 🛠️ Setup & Local Run

1. **Activate the virtual environment**:
   ```bash
   .venv\Scripts\activate
   ```

2. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

---

## 🧪 Verification

You can verify the backend APIs using the built-in test suites:

- **Automated Tests**:
  ```bash
  python manage.py test
  ```
- **Manual Integration Scenario Run**:
  ```bash
  python verify.py
  ```
