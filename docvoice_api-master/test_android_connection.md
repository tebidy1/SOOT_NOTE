# اختبار الاتصال بين Android والباك اند

## ✅ نتائج الاختبار

### 1. اختبار Login API
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gmail.com","password":"22222222"}'
```

**النتيجة:** ✅ نجح
```json
{
  "success": true,
  "message": "User logged in successfully",
  "user": {
    "id": 1,
    "name": "xzada",
    "email": "admin@gmail.com",
    "company_id": 3,
    "role": "company_manager",
    ...
  }
}
```

## 📱 إعدادات Android

### Base URL في Android
```dart
// في app_constants.dart
static const String baseUrl = 'http://localhost:8000/api';
```

### ملاحظات مهمة:
- **Android Emulator**: استخدم `http://localhost:8000/api`
- **Physical Device**: استخدم `http://YOUR_COMPUTER_IP:8000/api`
- **Web/Desktop**: استخدم `http://localhost:8000/api` أو `http://127.0.0.1:8000/api`

### Endpoints المتاحة:
- Login: `/auth/login`
- Register: `/auth/register`
- Profile: `/auth/profile`
- Logout: `/auth/logout`

## 🔧 خطوات الاختبار

### 1. تأكد من أن الباك اند يعمل:
```bash
cd backend
php artisan serve
```

### 2. اختبر من Android Emulator:
- تأكد من أن `baseUrl` في `app_constants.dart` هو `http://localhost:8000/api`
- قم بتشغيل التطبيق
- جرب تسجيل الدخول

### 3. اختبر من Physical Device:
- احصل على IP address للكمبيوتر:
  ```bash
  # Linux/Mac
  ifconfig | grep "inet "
  
  # Windows
  ipconfig
  ```
- غيّر `baseUrl` في `app_constants.dart` إلى `http://YOUR_IP:8000/api`
- تأكد من أن الكمبيوتر والجهاز على نفس الشبكة

## 🐛 حل المشاكل الشائعة

### المشكلة: Connection refused
**الحل:**
- تأكد من أن Laravel server يعمل
- تأكد من أن الـ port 8000 مفتوح
- للـ emulator: استخدم `10.0.2.2` بدلاً من `localhost`

### المشكلة: CORS error
**الحل:**
- تحقق من `config/cors.php`
- تأكد من أن الـ origin مسموح

### المشكلة: Timeout
**الحل:**
- زد الـ timeout في `app_constants.dart`:
  ```dart
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
  ```

## 📊 Response Format

الباك اند يعيد البيانات بهذا الشكل:
```json
{
  "success": true,
  "message": "User logged in successfully",
  "user": { ... },
  "token": "1|abc123..."
}
```

Android Service يتوقع هذا الشكل ويعالجه بشكل صحيح.

