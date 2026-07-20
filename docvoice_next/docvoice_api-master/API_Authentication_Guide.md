# API Authentication Guide

This guide provides comprehensive documentation for the Admin and Driver authentication API endpoints.

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {your-token-here}
```

---

## Admin Authentication

### 1. Register Admin
**POST** `/admin/register`

Register a new admin account.

**Request Body:**
```json
{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890"
}
```

**Response (201):**
```json
{
    "success": true,
    "message": "Admin registered successfully",
    "admin": {
        "id": 1,
        "name": "Admin Name",
        "email": "admin@example.com",
        "phone": "+1234567890",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    },
    "token": "1|abc123def456..."
}
```

### 2. Admin Login
**POST** `/login`

Login with admin credentials.

**Request Body:**
```json
{
    "email": "admin@example.com",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Admin logged in successfully",
    "admin": {
        "id": 1,
        "name": "Admin Name",
        "email": "admin@example.com",
        "phone": "+1234567890",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    },
    "token": "2|xyz789abc123..."
}
```

### 3. Admin Logout
**POST** `/admin/logout`

Logout from current device (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Admin logged out successfully"
}
```

### 4. Admin Logout All Devices
**POST** `/admin/logout-all`

Logout from all devices (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Admin logged out from all devices successfully"
}
```

### 5. Get Admin Profile
**GET** `/admin/profile`

Get current admin profile (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "admin": {
        "id": 1,
        "name": "Admin Name",
        "email": "admin@example.com",
        "phone": "+1234567890",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    }
}
```

### 6. Update Admin Profile
**PUT** `/admin/profile`

Update admin profile information (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "name": "Updated Admin Name",
    "email": "updated@example.com",
    "phone": "+9876543210"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "admin": {
        "id": 1,
        "name": "Updated Admin Name",
        "email": "updated@example.com",
        "phone": "+9876543210",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:35:00.000000Z"
    }
}
```

### 7. Change Admin Password
**POST** `/admin/change-password`

Change admin password (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "current_password": "oldpassword123",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

---

## Driver Authentication

### 1. Register Driver
**POST** `/driver/register`

Register a new driver account.

**Request Body:**
```json
{
    "name": "Driver Name",
    "email": "driver@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890",
    "license_number": "DL123456789"
}
```

**Response (201):**
```json
{
    "success": true,
    "message": "Driver registered successfully",
    "driver": {
        "id": 1,
        "name": "Driver Name",
        "email": "driver@example.com",
        "phone": "+1234567890",
        "license_number": "DL123456789",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    },
    "token": "3|def456ghi789..."
}
```

### 2. Driver Login
**POST** `/driver/login`

Login with driver credentials.

**Request Body:**
```json
{
    "email": "driver@example.com",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Driver logged in successfully",
    "driver": {
        "id": 1,
        "name": "Driver Name",
        "email": "driver@example.com",
        "phone": "+1234567890",
        "license_number": "DL123456789",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    },
    "token": "4|ghi789jkl012..."
}
```

### 3. Driver Logout
**POST** `/driver/logout`

Logout from current device (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Driver logged out successfully"
}
```

### 4. Driver Logout All Devices
**POST** `/driver/logout-all`

Logout from all devices (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Driver logged out from all devices successfully"
}
```

### 5. Get Driver Profile
**GET** `/driver/profile`

Get current driver profile (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "success": true,
    "driver": {
        "id": 1,
        "name": "Driver Name",
        "email": "driver@example.com",
        "phone": "+1234567890",
        "license_number": "DL123456789",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:30:00.000000Z"
    }
}
```

### 6. Update Driver Profile
**PUT** `/driver/profile`

Update driver profile information (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "name": "Updated Driver Name",
    "email": "updated.driver@example.com",
    "phone": "+9876543210",
    "license_number": "DL987654321"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "driver": {
        "id": 1,
        "name": "Updated Driver Name",
        "email": "updated.driver@example.com",
        "phone": "+9876543210",
        "license_number": "DL987654321",
        "status": "active",
        "created_at": "2025-08-22T06:30:00.000000Z",
        "updated_at": "2025-08-22T06:35:00.000000Z"
    }
}
```

### 7. Change Driver Password
**POST** `/driver/change-password`

Change driver password (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "current_password": "oldpassword123",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

---

## Error Responses

### Validation Error (422)
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": [
            "The email field is required."
        ],
        "password": [
            "The password field is required."
        ]
    }
}
```

### Authentication Error (401)
```json
{
    "message": "Unauthenticated."
}
```

### Account Status Error (403)
```json
{
    "success": false,
    "message": "Admin account is inactive"
}
```

### Invalid Credentials (422)
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": [
            "The provided credentials are incorrect."
        ]
    }
}
```

---

## Testing with cURL

### Register Admin
```bash
curl -X POST http://localhost:8000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890"
  }'
```

### Login Admin
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

### Get Admin Profile (with token)
```bash
curl -X GET http://localhost:8000/api/admin/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Register Driver
```bash
curl -X POST http://localhost:8000/api/driver/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "email": "driver@test.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890",
    "license_number": "DL123456789"
  }'
```

### Login Driver
```bash
curl -X POST http://localhost:8000/api/driver/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "password": "password123"
  }'
```

---

## Security Features

1. **Token-based Authentication**: Uses Laravel Sanctum for secure API token management
2. **Password Hashing**: All passwords are automatically hashed using Laravel's built-in hashing
3. **Token Revocation**: Supports logout from current device or all devices
4. **Account Status Check**: Validates account status before allowing login
5. **Input Validation**: Comprehensive validation for all input fields
6. **Unique Constraints**: Email and license numbers must be unique
7. **Password Confirmation**: Required for registration and password changes

## Database Tables

### Admins Table
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `email_verified_at` (Timestamp, Nullable)
- `password` (String, Hashed)
- `phone` (String, Nullable)
- `status` (Enum: active, inactive)
- `remember_token` (String, Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Drivers Table
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `email_verified_at` (Timestamp, Nullable)
- `password` (String, Hashed)
- `phone` (String, Nullable)
- `license_number` (String, Unique)
- `status` (Enum: active, inactive, suspended)
- `remember_token` (String, Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
