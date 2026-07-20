# Role-Based Access Control (RBAC) System

## Overview
This document explains how the role-based access control system works in the munjiz Laravel application.

## Role Types

### 1. Admin Role
- **Model**: `App\Models\Admin`
- **Permissions**: Full access to all operations (CRUD)
- **Guard**: `admin` (Sanctum)
- **Routes**: `/api/admin/*`

### 2. Driver Role
- **Model**: `App\Models\Driver`
- **Permissions**: Read and Update operations only
- **Guard**: `driver` (Sanctum)
- **Routes**: `/api/driver/*`

### 3. User Role
- **Model**: `App\Models\User`
- **Permissions**: Read operations only
- **Guard**: `web` (Sanctum)
- **Routes**: `/api/auth/user/*`

### 4. Super Admin Role
- **Model**: `App\Models\User` with `role = 'super_admin'`
- **Permissions**: Full access to all operations (CRUD)
- **Guard**: `web` (Sanctum)
- **Routes**: `/api/v1/tables/*`

## Permission Matrix

| Operation | Admin | Driver | User | Super Admin |
|-----------|-------|--------|------|-------------|
| **Read**  | ✅    | ✅     | ✅   | ✅          |
| **Create**| ✅    | ❌     | ❌   | ✅          |
| **Update**| ✅    | ✅     | ❌   | ✅          |
| **Delete**| ✅    | ❌     | ❌   | ✅          |

## Implementation Details

### 1. Route-Level Protection
Routes are grouped by role and protected with appropriate middleware:

```php
// Admin-only routes
Route::middleware('auth:admin')->group(function () {
    // Full CRUD access
});

// Driver routes - limited access
Route::middleware('auth:driver')->group(function () {
    // Read and Update only
});

// Regular user routes - read-only access
Route::middleware('auth:web')->group(function () {
    // Read only
});
```

### 2. Controller-Level Protection
Each CRUD method in `DynamicTableController` checks permissions:

```php
public function index(Request $request): JsonResponse
{
    // Check role-based permissions
    if (!$this->checkTablePermission('read')) {
        return $this->error([], 'ليس لديك صلاحية لقراءة البيانات', 403);
    }
    
    // ... rest of the method
}
```

### 3. Permission Checking Methods

#### `hasRole($role)`
Checks if the authenticated user has a specific role.

#### `hasAnyRole($roles)`
Checks if the user has any of the specified roles.

#### `hasAllRoles($roles)`
Checks if the user has all of the specified roles.

#### `checkTablePermission($operation)`
Checks if the user has permission for a specific table operation.

## Authentication Guards

### Guard Configuration (`config/auth.php`)
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'sanctum',
        'provider' => 'users',
    ],
    'admin' => [
        'driver' => 'sanctum',
        'provider' => 'admins',
    ],
    'driver' => [
        'driver' => 'sanctum',
        'provider' => 'drivers',
    ],
],
```

### User Providers
```php
'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
    'drivers' => [
        'driver' => 'eloquent',
        'model' => App\Models\Driver::class,
    ],
],
```

## Usage Examples

### 1. Checking Roles in Controllers
```php
use App\Http\Controllers\RoleCheckTrait;

class MyController extends Controller
{
    use RoleCheckTrait;
    
    public function someMethod()
    {
        if ($this->hasRole('admin')) {
            // Admin-specific logic
        }
        
        if ($this->hasAnyRole(['admin', 'super_admin'])) {
            // Logic for admin or super admin
        }
    }
}
```

### 2. Route Protection
```php
// Protect routes by role
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin-only', [AdminController::class, 'index']);
});

// Multiple role protection
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])->group(function () {
    Route::get('/admin-super', [Controller::class, 'index']);
});
```

### 3. Blade Template Usage
```php
@if(auth()->check() && auth()->user() instanceof \App\Models\Admin)
    <!-- Admin-only content -->
@endif

@if(auth()->check() && auth()->user()->role === 'super_admin')
    <!-- Super admin content -->
@endif
```

## Security Features

### 1. Automatic Guard Detection
The system automatically detects the appropriate guard based on the request path:
- `/api/admin/*` → `admin` guard
- `/api/driver/*` → `driver` guard
- `/api/auth/user/*` → `web` guard

### 2. Role Validation
- Admin users can only access admin routes
- Driver users can only access driver routes
- Regular users can only access user routes

### 3. Operation-Level Security
Even within allowed routes, users can only perform operations they have permission for:
- Drivers can read and update but cannot create or delete
- Regular users can only read data

## Error Responses

When access is denied, the system returns standardized error responses:

```json
{
    "status": false,
    "code": 403,
    "message": "ليس لديك صلاحية للوصول لهذا المورد"
}
```

## Best Practices

### 1. Always Check Permissions
- Check permissions at both route and controller levels
- Use the provided permission checking methods
- Don't rely solely on route middleware

### 2. Role Hierarchy
- Super Admin > Admin > Driver > User
- Higher roles inherit permissions from lower roles
- Use role checking methods to implement this hierarchy

### 3. Security Auditing
- Log all permission checks
- Monitor failed access attempts
- Regularly review role assignments

## Troubleshooting

### Common Issues

1. **Guard Mismatch**: Ensure the correct guard is used for each route
2. **Role Not Found**: Check if the user model has the correct role field
3. **Permission Denied**: Verify the user has the required role for the operation

### Debug Mode
Enable debug logging to see permission checks:
```php
\Log::info('User role check: ' . $this->hasRole('admin'));
\Log::info('Permission check: ' . $this->checkTablePermission('read'));
```

## Future Enhancements

1. **Permission Groups**: Group permissions by module/feature
2. **Dynamic Roles**: Allow admins to create custom roles
3. **Audit Trail**: Track all permission changes and access attempts
4. **Time-Based Access**: Restrict access based on time of day
5. **IP-Based Restrictions**: Limit access to specific IP addresses

---

**Last Updated**: $(date)
**Version**: 1.0
**Author**: munjiz Development Team
