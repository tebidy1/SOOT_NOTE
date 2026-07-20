# إصلاح DashboardController - الإصدار 2.0

## المشاكل التي تم حلها

### 1. **خطأ "Too few arguments"**
```
Too few arguments to function App\Http\Controllers\DashboardController::getOverviewStats(), 
0 passed in ... exactly 2 expected
```

**السبب:** تم استدعاء الدالة بدون معاملات بينما تتوقع معاملين (`$companyId`, `$period`)

**الحل:** تم التأكد من أن جميع استدعاءات الدوال تمرر المعاملات المطلوبة

### 2. **أعمدة غير موجودة في قاعدة البيانات**

#### ❌ **قبل الإصلاح:**
```php
// أعمدة غير موجودة
->sum('total_amount')           // لا يوجد
->where('status', 'completed')  // لا يوجد
->count()                       // خطأ في المنطق للطلبات
```

#### ✅ **بعد الإصلاح:**
```php
// أعمدة صحيحة من قاعدة البيانات
->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'))  // استخدام amount
->where('status', 'active')                       // استخدام 'active'
->sum('totalOrders')                              // استخدام totalOrders
```

## التحديثات المطبقة

### **1. دالة getOverviewStats**
```php
public function getOverviewStats(int $companyId, string $period): array
{
    $dateFilter = $this->getDateFilter($period);
    
    return [
        'total_drivers' => Driver::where('company_id', $companyId)->count(),
        'active_drivers' => Driver::where('company_id', $companyId)->where('status', 'active')->count(),
        'total_orders' => PlatformOrder::where('company_id', $companyId)
            ->whereBetween('created_at', $dateFilter)
            ->sum('totalOrders'), // ✅ استخدام totalOrders
        'completed_orders' => PlatformOrder::where('company_id', $companyId)
            ->where('status', 'active') // ✅ استخدام 'active'
            ->whereBetween('created_at', $dateFilter)
            ->sum('totalOrders'),
        'total_revenue' => PlatformOrder::where('company_id', $companyId)
            ->where('status', 'active')
            ->whereBetween('created_at', $dateFilter)
            ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))')), // ✅ استخدام amount
        'total_expenses' => Transaction::where('company_id', $companyId)
            ->where('type', 'expense')
            ->whereBetween('created_at', $dateFilter)
            ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))')), // ✅ استخدام Transaction
        'pending_payrolls' => DriverPayroll::where('company_id', $companyId)
            ->where('payment_status', 'pending')->count(), // ✅ استخدام payment_status
        'completed_payrolls' => DriverPayroll::where('company_id', $companyId)
            ->where('payment_status', 'paid')->count() // ✅ استخدام payment_status
    ];
}
```

### **2. دالة getPayrollStats**
```php
public function getPayrollStats(int $companyId, string $period): array
{
    $dateFilter = $this->getDateFilter($period);
    
    $payrolls = DriverPayroll::where('company_id', $companyId)
        ->whereBetween('created_at', $dateFilter);
    
    return [
        'total' => $payrolls->count(),
        'pending' => $payrolls->where('payment_status', 'pending')->count(), // ✅
        'completed' => $payrolls->where('payment_status', 'paid')->count(), // ✅
        'total_amount' => $payrolls->where('payment_status', 'paid')
            ->sum('net_salary'), // ✅ استخدام net_salary
        'average_payroll' => $payrolls->where('payment_status', 'paid')
            ->avg('net_salary'), // ✅ استخدام net_salary
        'by_status' => $payrolls->select('payment_status', DB::raw('count(*) as count'))
            ->groupBy('payment_status') // ✅ استخدام payment_status
            ->pluck('count', 'payment_status')
            ->toArray()
    ];
}
```

### **3. دالة getReportsStats**
```php
public function getReportsStats(int $companyId, string $period): array
{
    $dateFilter = $this->getDateFilter($period);
    
    // ✅ استخدام Transaction بدلاً من DailyReport
    $reports = Transaction::where('company_id', $companyId)
        ->where('type', 'expense')
        ->whereBetween('created_at', $dateFilter);
    
    return [
        'total' => $reports->count(),
        'this_week' => $reports->whereBetween('created_at', [
            Carbon::now()->startOfWeek(), 
            Carbon::now()->endOfWeek()
        ])->count(),
        'this_month' => $reports->whereBetween('created_at', [
            Carbon::now()->startOfMonth(), 
            Carbon::now()->endOfMonth()
        ])->count(),
        'by_type' => $reports->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray()
    ];
}
```

### **4. تنظيف الاستيرادات**
```php
// ❌ تم إزالة الاستيرادات غير المستخدمة
// use App\Models\DailyReport;
// use App\Models\Expense;

// ✅ الاستيرادات المستخدمة فقط
use App\Models\Driver;
use App\Models\PlatformOrder;
use App\Models\DriverPayroll;
use App\Models\Transaction;
use App\Models\Advance;
use App\Models\Company;
use App\Models\User;
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

## الاختبار

### **1. اختبار جلب الإحصائيات**
```bash
curl -X GET "http://localhost:8000/api/company/dashboard/statistics?period=month" \
  -H "Authorization: Bearer {token}"
```

**النتيجة المتوقعة:**
```json
{
  "status": true,
  "code": 200,
  "message": "تم جلب إحصائيات الداشبورد بنجاح",
  "payload": {
    "overview": {
      "total_drivers": 32,
      "active_drivers": 30,
      "total_orders": 641,
      "completed_orders": 600,
      "total_revenue": 15000.00,
      "total_expenses": 5000.00,
      "pending_payrolls": 5,
      "completed_payrolls": 25
    },
    "drivers": { ... },
    "orders": { ... },
    "payroll": { ... },
    "reports": { ... },
    "expenses": { ... },
    "financial": { ... },
    "recent_activity": { ... },
    "charts_data": { ... }
  }
}
```

### **2. اختبار الملخص السريع**
```bash
curl -X GET "http://localhost:8000/api/company/dashboard/quick-summary" \
  -H "Authorization: Bearer {token}"
```

### **3. اختبار التحديثات الفورية**
```bash
curl -X GET "http://localhost:8000/api/company/dashboard/real-time-updates" \
  -H "Authorization: Bearer {token}"
```

## النتائج المتوقعة

### ✅ **بعد الإصلاح:**
- عدم وجود أخطاء "Too few arguments"
- عدم وجود أخطاء SQL
- عرض البيانات الصحيحة من قاعدة البيانات
- عمل جميع الإحصائيات
- عمل الرسوم البيانية
- عمل التحديثات الفورية

### ❌ **قبل الإصلاح:**
- أخطاء "Too few arguments"
- أخطاء SQL متكررة
- عدم عرض البيانات
- توقف الداشبورد
- رسائل خطأ للمستخدمين

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

### 4. **استخدام Transaction بدلاً من Expense**
```php
// استبدال Expense بـ Transaction
Transaction::where('company_id', $companyId)
    ->where('type', 'expense')
```

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
**الإصدار**: 2.0.0
**آخر تحديث**: $(date)
