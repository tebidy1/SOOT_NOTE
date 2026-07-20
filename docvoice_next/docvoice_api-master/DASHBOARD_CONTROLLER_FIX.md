# إصلاح DashboardController - توافق مع قاعدة البيانات الفعلية

## المشكلة الأصلية

كان هناك خطأ في `DashboardController` بسبب استخدام أعمدة غير موجودة في قاعدة البيانات الفعلية:

```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'total_amount' in 'field list'
```

## التحديثات المطبقة

### 1. **إصلاح أعمدة PlatformOrders**

#### ❌ **قبل الإصلاح:**
```php
// أعمدة غير موجودة
->sum('total_amount')           // لا يوجد
->where('status', 'completed')  // لا يوجد
->count()                       // خطأ في المنطق
```

#### ✅ **بعد الإصلاح:**
```php
// أعمدة صحيحة من قاعدة البيانات
->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'))  // استخدام amount
->where('status', 'active')                       // استخدام 'active'
->sum('totalOrders')                              // استخدام totalOrders
```

### 2. **إصلاح أعمدة Drivers**

#### ❌ **قبل الإصلاح:**
```php
->get(['id', 'name', 'phone', 'status', 'created_at'])
```

#### ✅ **بعد الإصلاح:**
```php
->get(['id', 'name', 'mobile_number', 'status', 'created_at'])
```

### 3. **استبدال Expense بـ Transaction**

#### ❌ **قبل الإصلاح:**
```php
use App\Models\Expense;
// ...
Expense::where('company_id', $companyId)
```

#### ✅ **بعد الإصلاح:**
```php
use App\Models\Transaction;
// ...
Transaction::where('company_id', $companyId)
    ->where('type', 'expense')
```

### 4. **إصلاح أعمدة DriverPayroll**

#### ❌ **قبل الإصلاح:**
```php
->where('status', 'completed')
->sum('total_amount')
```

#### ✅ **بعد الإصلاح:**
```php
->where('payment_status', 'paid')
->sum('net_salary')
```

## تفاصيل التحديثات

### **دالة getOrdersStats**
```php
// تحديث الأعمدة المستخدمة
'total' => $orders->sum('totalOrders'), // بدلاً من count()
'completed' => $orders->where('status', 'active')->sum('totalOrders'),
'total_amount' => $orders->where('status', 'active')
    ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))')),
```

### **دالة getFinancialStats**
```php
// تحديث مصادر البيانات
$revenue = PlatformOrder::where('status', 'active')
    ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));

$expenses = Transaction::where('type', 'expense')
    ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));

$payrolls = DriverPayroll::where('payment_status', 'paid')
    ->sum('net_salary');
```

### **دالة getRecentActivity**
```php
// تحديث الأعمدة المستخدمة
'recent_orders' => PlatformOrder::select(['id', 'status', 'amount', 'totalOrders', 'created_at']),
'recent_drivers' => Driver::select(['id', 'name', 'mobile_number', 'status', 'created_at']),
'recent_expenses' => Transaction::where('type', 'expense')
    ->select(['id', 'notes', 'amount', 'created_at']),
'recent_payrolls' => DriverPayroll::select(['id', 'driver_id', 'net_salary', 'payment_status', 'created_at'])
```

### **دالة getExpensesStats**
```php
// استبدال Expense بـ Transaction
$expenses = Transaction::where('company_id', $companyId)
    ->where('type', 'expense')
    ->whereBetween('created_at', $dateFilter);

// تحديث الأعمدة
'by_category' => $expenses->select('category_id', DB::raw('sum(CAST(amount AS DECIMAL(10,2))) as total'))
    ->groupBy('category_id')
    ->pluck('total', 'category_id')
    ->toArray(),
```

## هيكل قاعدة البيانات الفعلي

### **جدول platform_orders**
```sql
CREATE TABLE `platform_orders` (
  `id` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',        -- 'active', 'pending', 'inactive'
  `totalOrders` int(11) DEFAULT 0,               -- عدد الطلبات
  `amount` varchar(255) DEFAULT NULL,            -- المبلغ (نص)
  `company_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  -- ... باقي الأعمدة
);
```

### **جدول drivers**
```sql
CREATE TABLE `drivers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,     -- رقم الهاتف
  `status` varchar(255) DEFAULT NULL,            -- 'active', 'inactive'
  `company_id` int(11) NOT NULL,
  -- ... باقي الأعمدة
);
```

### **جدول transactions**
```sql
CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `amount` varchar(255) DEFAULT NULL,            -- المبلغ (نص)
  `type` varchar(255) DEFAULT NULL,              -- 'expense', 'advance'
  `category_id` varchar(255) DEFAULT NULL,       -- معرف الفئة
  `company_id` bigint(20) DEFAULT NULL,
  -- ... باقي الأعمدة
);
```

### **جدول driver_payrolls**
```sql
CREATE TABLE `driver_payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_status` enum('pending','paid','cancelled'), -- حالة الدفع
  `net_salary` decimal(10,2) NOT NULL DEFAULT 0.00,   -- صافي الراتب
  -- ... باقي الأعمدة
);
```

## ملاحظات مهمة

### 1. **معالجة البيانات النصية**
```php
// تحويل المبالغ من نص إلى رقم
DB::raw('CAST(amount AS DECIMAL(10,2))')
```

### 2. **حالات الطلبات**
```php
// استخدام الحالات الصحيحة
'active'    // بدلاً من 'completed'
'pending'   // كما هو
'inactive'  // بدلاً من 'cancelled'
```

### 3. **حالات الرواتب**
```php
// استخدام الحالات الصحيحة
'pending'   // في انتظار الدفع
'paid'      // تم الدفع
'cancelled' // ملغي
```

## الاختبار

### 1. **اختبار الطلبات**
```bash
# اختبار جلب الإحصائيات
curl -X GET "http://localhost:8000/api/company/dashboard/statistics?period=month" \
  -H "Authorization: Bearer {token}"
```

### 2. **اختبار الملخص السريع**
```bash
# اختبار الملخص السريع
curl -X GET "http://localhost:8000/api/company/dashboard/quick-summary" \
  -H "Authorization: Bearer {token}"
```

### 3. **اختبار التحديثات الفورية**
```bash
# اختبار التحديثات الفورية
curl -X GET "http://localhost:8000/api/company/dashboard/real-time-updates" \
  -H "Authorization: Bearer {token}"
```

## النتائج المتوقعة

### ✅ **بعد الإصلاح:**
- عدم وجود أخطاء SQL
- عرض البيانات الصحيحة
- عمل جميع الإحصائيات
- عمل الرسوم البيانية
- عمل التحديثات الفورية

### ❌ **قبل الإصلاح:**
- أخطاء SQL متكررة
- عدم عرض البيانات
- توقف الداشبورد
- رسائل خطأ للمستخدمين

## التطوير المستقبلي

### 1. **إضافة فئات المصروفات**
```php
// إضافة فئات المصروفات
'by_category' => Transaction::where('company_id', $companyId)
    ->where('type', 'expense')
    ->join('expensecategories', 'transactions.category_id', '=', 'expensecategories.id')
    ->select('expensecategories.name', DB::raw('sum(CAST(transactions.amount AS DECIMAL(10,2))) as total'))
    ->groupBy('expensecategories.name')
    ->pluck('total', 'expensecategories.name')
    ->toArray(),
```

### 2. **إضافة إحصائيات السائقين**
```php
// إضافة إحصائيات السائقين
'drivers_by_status' => Driver::where('company_id', $companyId)
    ->select('status', DB::raw('count(*) as count'))
    ->groupBy('status')
    ->pluck('count', 'status')
    ->toArray(),
```

### 3. **إضافة إحصائيات المركبات**
```php
// إضافة إحصائيات المركبات
'vehicles_stats' => Vehicle::where('company_id', $companyId)
    ->select('status', DB::raw('count(*) as count'))
    ->groupBy('status')
    ->pluck('count', 'status')
    ->toArray(),
```

---

**تاريخ الإصلاح**: $(date)
**الإصدار**: 1.1.0
**آخر تحديث**: $(date)
