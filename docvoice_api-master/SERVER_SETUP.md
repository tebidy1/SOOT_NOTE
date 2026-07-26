# إعداد Laravel Server للعمل مع Android Emulator

## 🔴 المشكلة

عند تشغيل Laravel server بالطريقة الافتراضية:
```bash
php artisan serve
```

الـ server يستمع فقط على `127.0.0.1:8000`، وهذا يعني:
- ✅ يعمل من المتصفح على نفس الكمبيوتر
- ❌ **لا يعمل من Android Emulator** (10.0.2.2)

## ✅ الحل

### الطريقة 1: استخدام الأمر المباشر
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

### الطريقة 2: استخدام Script
```bash
cd backend
./start_server.sh
```

## 📋 التحقق من أن Server يعمل بشكل صحيح

### 1. تحقق من الـ Port
```bash
netstat -tuln | grep 8000
# أو
ss -tuln | grep 8000
```

**يجب أن ترى:**
```
tcp  0  0  0.0.0.0:8000  0.0.0.0:*  LISTEN
```

**وليس:**
```
tcp  0  0  127.0.0.1:8000  0.0.0.0:*  LISTEN  ❌
```

### 2. اختبر من localhost
```bash
curl http://localhost:8000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gmail.com","password":"22222222"}'
```

### 3. اختبر من 10.0.2.2 (Emulator)
```bash
curl http://localhost:8000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gmail.com","password":"22222222"}'
```

**ملاحظة:** هذا الاختبار قد يفشل إذا لم تكن تعمل من داخل Android Emulator. هذا طبيعي.

## 🎯 الإعدادات الصحيحة

### Android Emulator
```dart
// في app_constants.dart
// ⚠️ مهم: Android Emulator يستخدم 10.0.2.2 للوصول إلى localhost
static const String baseUrl = 'http://localhost:8000/api';
```

### Physical Device
```dart
// احصل على IP الكمبيوتر
// Linux/Mac: ifconfig | grep "inet "
// Windows: ipconfig

static const String baseUrl = 'http://192.168.1.100:8000/api';
```

### Web/Desktop
```dart
static const String baseUrl = 'http://localhost:8000/api';
```

## ⚠️ ملاحظات مهمة

1. **أمان:** `--host=0.0.0.0` يجعل الـ server متاحاً على جميع الـ interfaces. استخدمه فقط في التطوير.

2. **Firewall:** تأكد من أن الـ firewall يسمح بالاتصال على port 8000.

3. **Network:** للـ Physical Device، تأكد من أن الكمبيوتر والجهاز على نفس الشبكة.

## 🐛 حل المشاكل

### المشكلة: Connection refused
**الحل:**
- تأكد من أن Server يعمل على `0.0.0.0` وليس `127.0.0.1`
- تحقق من الـ firewall

### المشكلة: Timeout
**الحل:**
- تحقق من أن Server يعمل
- للـ Physical Device: تحقق من IP address

### المشكلة: CORS error
**الحل:**
- تحقق من `config/cors.php`
- تأكد من أن الـ origins مسموحة

