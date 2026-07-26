# Laravel Smart API Tester Agent Pro

An intelligent testing assistant for Laravel API endpoints with resume capability.

## Features

- ✅ **Auto-scan** all API endpoints from route files
- ✅ **Auto-generate** realistic test payloads from FormRequest validation rules
- ✅ **Resume capability** - skip already tested endpoints
- ✅ **State management** - track tested/failed endpoints
- ✅ **Comprehensive reports** - detailed test results and summaries
- ✅ **Authentication support** - handles Sanctum tokens and test user IDs

## Installation

No installation needed! The system uses existing Laravel dependencies:
- Guzzle HTTP Client (for API requests)
- Laravel Framework (for route scanning)

## Usage

### Basic Commands

```bash
# Scan all API endpoints
php tests/ApiTester/run-tests.php scan

# Test all endpoints (with resume)
php tests/ApiTester/run-tests.php test

# Test a single endpoint
php tests/ApiTester/run-tests.php test-one "GET|/api/users"

# Retry failed endpoints
php tests/ApiTester/run-tests.php retry-failed

# Reset state (clear all tested endpoints)
php tests/ApiTester/run-tests.php reset

# Show current status
php tests/ApiTester/run-tests.php status
```

### Configuration

Set the API base URL via environment variable:

```bash
export API_BASE_URL=http://localhost:8000
php tests/ApiTester/run-tests.php test
```

## How It Works

### 1. Endpoint Scanning

The system scans:
- `routes/api.php`
- `routes/auth.php`
- All registered Laravel routes

For each endpoint, it extracts:
- HTTP Method (GET, POST, PUT, PATCH, DELETE)
- Full URI path
- Controller and method
- Middleware
- Route name

### 2. Payload Generation

For POST/PUT/PATCH requests, the system:
- Finds the corresponding FormRequest class
- Extracts validation rules
- Generates realistic test data:
  - **Emails**: Valid email formats
  - **Names**: Realistic names with length constraints
  - **Passwords**: Meets min length requirements
  - **Foreign Keys**: Uses existing IDs from database
  - **Enums**: Extracts allowed values
  - **Dates**: Valid date formats
  - **Arrays**: Proper array structures

### 3. State Management

State is saved in `tests/ai-results/endpoint-state.json`:

```json
{
  "last_updated": "2024-01-15 10:30:00",
  "tested_endpoints": ["GET|/api/users", "POST|/api/auth/login"],
  "failed_endpoints": [...],
  "total_endpoints": 125,
  "tested_count": 28,
  "failed_count": 97,
  "pending_count": 0
}
```

### 4. Testing Workflow

1. **Read State**: Load tested endpoints from state file
2. **Skip Tested**: Automatically skip already tested endpoints
3. **Test Endpoint**: Make HTTP request with generated payload
4. **Save Result**: Immediately save to state file (incremental)
5. **Generate Report**: Create detailed reports

### 5. Result Files

All results are saved in `tests/ai-results/`:

- `endpoint-state.json` - Main state file
- `scan-results.json` - All detected endpoints
- `failed_endpoints.json` - Failed tests log
- `summary-report.json` - Final summary
- `{METHOD}-{endpoint-slug}.json` - Individual test results

## Authentication

The system supports two authentication methods:

1. **Sanctum Token**: Automatically authenticates with test credentials
2. **Test User ID**: Uses `X-User-IID` header (for development/testing)

## Example Output

```
🔍 Scanning project for API endpoints...
✅ Found 125 endpoints

📊 Resuming: 28/125 endpoints already tested

[29/125] Testing POST|/api/messages...
✅ Success (201) - 145ms

[30/125] Testing GET|/api/users/1...
✅ Success (200) - 89ms

📊 Summary Report:
   Total: 125
   Success: 95
   Failed: 30
   Success Rate: 76%
   Report saved to: tests/ai-results/summary-report.json
```

## Troubleshooting

### Authentication Failures

If authentication fails, the system will:
1. Try to use test user ID authentication
2. Continue testing with limited access

### Missing FormRequest Classes

If a FormRequest class is not found, the system will:
1. Generate basic payload based on endpoint URI
2. Use minimal required fields

### Route Parameter Issues

Route parameters like `{id}` are automatically replaced with test values (default: 1).

## Advanced Usage

### Custom Base URL

```bash
API_BASE_URL=https://api.example.com php tests/ApiTester/run-tests.php test
```

### Testing Specific Endpoints

```bash
php tests/ApiTester/run-tests.php test-one "POST|/api/auth/login"
php tests/ApiTester/run-tests.php test-one "GET|/api/users/1"
```

## File Structure

```
tests/ApiTester/
├── ApiTester.php          # HTTP client for testing
├── ApiTestRunner.php      # Main test runner
├── PayloadGenerator.php   # Generate test payloads
├── RouteScanner.php       # Scan API endpoints
├── StateManager.php       # Manage test state
├── run-tests.php          # CLI entry point
└── README.md              # This file

tests/ai-results/
├── endpoint-state.json    # State file
├── scan-results.json      # Scan results
├── failed_endpoints.json  # Failed tests
└── summary-report.json    # Summary report
```

## Safety Features

- ✅ Never modifies code
- ✅ Only tests existing endpoints
- ✅ Respects rate limits
- ✅ Uses test database when possible
- ✅ Backs up state before major operations

## Contributing

When adding new features:
1. Follow PSR-12 coding standards
2. Add type hints for all methods
3. Handle errors gracefully
4. Update this README

## License

Part of the Laravel Smart API Tester Agent Pro system.
