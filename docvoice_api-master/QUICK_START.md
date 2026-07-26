# 🚀 Quick Start Guide

## ✅ الباك اند يعمل الآن!

الباك اند يعمل على `0.0.0.0:8000` ويمكن الوصول إليه من:
- ✅ Localhost: `http://localhost:8000`
- ✅ Android Emulator: `http://localhost:8000`
- ✅ Network: `http://YOUR_IP:8000`

## 📱 لتشغيل التطبيق

### 1. تأكد من أن الباك اند يعمل
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

**يجب أن ترى:**
```
INFO  Server running on [http://0.0.0.0:8000].
```

**وليس:**
```
INFO  Server running on [http://127.0.0.1:8000].  ❌
```

### 2. تحقق من الـ Port
```bash
netstat -tuln | grep 8000
```

**يجب أن ترى:**
```
tcp  0  0  0.0.0.0:8000  0.0.0.0:*  LISTEN  ✅
```

**وليس:**
```
tcp  0  0  127.0.0.1:8000  0.0.0.0:*  LISTEN  ❌
```

### 3. شغّل Android Emulator
```bash
flutter emulators --launch <emulator_id>
```

### 4. شغّل التطبيق
```bash
cd android
flutter run
```

## 🔍 التحقق من الاتصال

بعد الضغط على تسجيل الدخول، يجب أن ترى في:
- **Android Logs:** `🔵 [AuthApiService] Starting login request...`
- **Laravel Logs:** `2025-11-13 XX:XX:XX /api/auth/login`

إذا رأيت الطلب في Laravel logs، فالاتصال يعمل! ✅

## ⚠️ إذا لم يعمل

1. **تحقق من Base URL:**
   ```dart
   // في app_constants.dart
   static const String baseUrl = 'http://localhost:8000/api';
   ```

2. **تحقق من Server:**
   ```bash
   netstat -tuln | grep 8000
   # يجب أن يكون: 0.0.0.0:8000
   ```

3. **تحقق من Network Security Config:**
   - يجب أن يكون `network_security_config.xml` موجود
   - يجب أن يكون `usesCleartextTraffic="true"` في AndroidManifest.xml

## 🎯 ملخص

- ✅ الباك اند يعمل على `0.0.0.0:8000`
- ✅ Android Emulator يستخدم `10.0.2.2:8000`
- ✅ الطلبات تصل إلى الباك اند

**جرب تسجيل الدخول الآن!** 🚀

