# دليل اختبار الاتصال بين Android والباك اند

## ✅ ما تم إصلاحه

### 1. إصلاح Network Security Config
- تم إنشاء `network_security_config.xml` للسماح بـ HTTP traffic
- تم إضافة `usesCleartextTraffic="true"` في AndroidManifest.xml
- هذا ضروري للـ Android 9+ للسماح بالاتصال عبر HTTP

### 2. إضافة Debugging
- تم إضافة print statements في `AuthApiService` لتتبع الطلبات
- يمكنك الآن رؤية ما يحدث في الـ console/logcat

## 🧪 خطوات الاختبار

### 1. اختبار من المتصفح
افتح الملف: `backend/test_login_browser.html` في المتصفح
- يجب أن يعمل بشكل صحيح
- إذا عمل، فالمشكلة في Android فقط

### 2. اختبار من Android

#### أ. تحقق من الـ Logs
```bash
# في terminal منفصل
cd android
flutter run
# أو
adb logcat | grep -i "AuthApiService\|Dio\|Network"
```

#### ب. تحقق من Base URL
في `android/lib/core/constants/app_constants.dart`:
```dart
// للـ Emulator
static const String baseUrl = 'http://localhost:8000/api';

// للـ Physical Device (استبدل YOUR_IP)
static const String baseUrl = 'http://YOUR_COMPUTER_IP:8000/api';
```

#### ج. تحقق من أن Laravel يعمل
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

#### د. اختبر من curl
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gmail.com","password":"22222222"}'
```

## 🔍 Debugging في Android

### 1. تحقق من الـ Logs
ابحث عن:
- `🔵 [AuthApiService]` - بداية الطلب
- `🟢 [AuthApiService]` - نجاح الطلب
- `🔴 [AuthApiService]` - خطأ في الطلب

### 2. المشاكل الشائعة

#### المشكلة: لا يظهر أي log
**الحل:**
- تأكد من أن الـ button يعمل
- تحقق من أن `_handleSubmit` يتم استدعاؤه
- أضف `print` في `login_screen.dart` قبل `authNotifier.login()`

#### المشكلة: Connection Error
**الحل:**
- تحقق من Base URL
- تحقق من أن Laravel server يعمل
- للـ Physical Device: تأكد من أن الكمبيوتر والجهاز على نفس الشبكة

#### المشكلة: Timeout
**الحل:**
- زد الـ timeout في `app_constants.dart`
- تحقق من firewall

## 📱 إعدادات مختلفة

### Android Emulator
```dart
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

## 🐛 خطوات Debugging المتقدمة

### 1. أضف print في login_screen.dart
```dart
Future<void> _handleSubmit() async {
  print('🔵 [LoginScreen] Submit button pressed');
  print('🔵 [LoginScreen] Email: ${_emailController.text}');
  
  // ... rest of code
}
```

### 2. تحقق من Dio Interceptors
الـ `PrettyDioLogger` يجب أن يظهر الطلبات في الـ console

### 3. تحقق من Network Permissions
في `AndroidManifest.xml` يجب أن يكون:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

## ✅ Checklist

- [ ] Laravel server يعمل على port 8000
- [ ] Base URL صحيح في `app_constants.dart`
- [ ] Network Security Config موجود
- [ ] AndroidManifest.xml محدث
- [ ] يمكن الوصول للـ API من curl
- [ ] يمكن الوصول للـ API من المتصفح
- [ ] الـ logs تظهر في logcat
- [ ] الـ button يعمل (يظهر loading)

## 📞 إذا استمرت المشكلة

1. افتح `test_login_browser.html` في المتصفح
2. إذا عمل، المشكلة في Android فقط
3. راجع الـ logs في logcat
4. تحقق من Base URL مرة أخرى

