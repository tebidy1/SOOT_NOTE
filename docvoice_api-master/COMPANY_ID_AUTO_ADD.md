# إضافة company_id تلقائياً - DynamicTableController

## التحديث الجديد
تم إضافة وظيفة جديدة في `DynamicTableController` تتحقق تلقائياً من وجود عمود `company_id` في الجدول وتضيفه إلى البيانات قبل الحفظ أو التحديث.

## المشكلة السابقة
كان النظام يحفظ البيانات أولاً ثم يحاول تحديث `company_id` في عملية منفصلة:
```php
$record = $modelClass::create($processedData);
$id = $record->id;
$company_id = $this->getCompanyId($request);
if ($company_id != null) {
    $record->company_id = $company_id;
    $record->save(); // عملية تحديث إضافية
}
```

## الحل الجديد
الآن يتم التحقق من وجود `company_id` في الجدول وإضافته إلى البيانات قبل الحفظ:

### 1. في دالة `store` (إنشاء سجل جديد)
```php
// التحقق من وجود company_id في الجدول وإضافته تلقائياً
$company_id = $this->getCompanyId($request);
if ($company_id !== null && $this->tableHasCompanyId($table)) {
    $processedData['company_id'] = $company_id;
}

// إنشاء السجل باستخدام المودل
$record = $modelClass::create($processedData);
```

### 2. في دالة `update` (تحديث سجل موجود)
```php
// التحقق من وجود company_id في الجدول وإضافته تلقائياً للتحديث
$company_id = $this->getCompanyId($request);
if ($company_id !== null && $this->tableHasCompanyId($table)) {
    $processedData['company_id'] = $company_id;
}

// استخدام المودل للتحديث
$record = $modelClass::find($id);
$updated = $record ? $record->update($processedData) : false;
```

## الدوال الجديدة

### دالة `tableHasCompanyId`
```php
/**
 * التحقق من وجود عمود company_id في الجدول
 */
public function tableHasCompanyId(string $table): bool
{
    try {
        return Schema::hasColumn($table, 'company_id');
    } catch (\Exception $e) {
        // إذا فشل التحقق، نفترض عدم وجود company_id
        return false;
    }
}
```

## كيفية عمل النظام

### 1. عند إنشاء سجل جديد
1. يتم استخراج `company_id` من الطلب
2. يتم التحقق من وجود عمود `company_id` في الجدول
3. إذا كان موجوداً، يتم إضافته إلى `$processedData`
4. يتم حفظ السجل مع `company_id` في عملية واحدة

### 2. عند تحديث سجل موجود
1. يتم استخراج `company_id` من الطلب
2. يتم التحقق من وجود عمود `company_id` في الجدول
3. إذا كان موجوداً، يتم إضافته إلى `$processedData`
4. يتم تحديث السجل مع `company_id` في عملية واحدة

## الفوائد من هذا التحديث

### 1. تحسين الأداء
- **قبل**: عمليتان منفصلتان (حفظ + تحديث)
- **بعد**: عملية واحدة فقط (حفظ مع company_id)

### 2. تقليل أخطاء قاعدة البيانات
- لا حاجة لعمليات تحديث إضافية
- تقليل احتمالية حدوث أخطاء في قاعدة البيانات

### 3. كود أنظف
- منطق أوضح وأسهل للفهم
- تقليل الكود المكرر

### 4. أمان أكبر
- `company_id` يتم إضافته تلقائياً
- لا يمكن نسيان إضافته يدوياً

## أمثلة على الاستخدام

### مثال 1: إنشاء سائق جديد
```php
// البيانات المرسلة
$data = [
    'name' => 'أحمد محمد',
    'mobile_number' => '0501234567',
    'status' => 'active'
];

// النظام يضيف company_id تلقائياً
$processedData = [
    'name' => 'أحمد محمد',
    'mobile_number' => '0501234567',
    'status' => 'active',
    'company_id' => 1 // تم إضافته تلقائياً
];
```

### مثال 2: تحديث بيانات مركبة
```php
// البيانات المرسلة
$data = [
    'status' => 'in_workshop',
    'history' => [/* ... */]
];

// النظام يضيف company_id تلقائياً
$processedData = [
    'status' => 'in_workshop',
    'history' => [/* ... */],
    'company_id' => 1 // تم إضافته تلقائياً
];
```

## الجداول المدعومة

النظام يعمل مع جميع الجداول التي تحتوي على عمود `company_id`:

- ✅ `drivers` - السائقين
- ✅ `vehicles` - المركبات
- ✅ `platform_orders` - طلبات المنصات
- ✅ `transactions` - المعاملات
- ✅ `driver_payrolls` - رواتب السائقين
- ✅ `daily_reports` - التقارير اليومية
- ✅ `expenses` - المصروفات
- ✅ `advances` - السلف

## ملاحظات مهمة

### 1. الجداول بدون company_id
إذا كان الجدول لا يحتوي على عمود `company_id`، فلن يتم إضافته:
```php
// جدول users لا يحتوي على company_id
// لن يتم إضافة company_id إلى البيانات
```

### 2. الطلبات بدون company_id
إذا كان الطلب لا يحتوي على `company_id`، فلن يتم إضافته:
```php
// إذا كان المستخدم غير مصادق عليه
// لن يتم إضافة company_id إلى البيانات
```

### 3. الأمان
`company_id` يتم استخراجه من المستخدم المُصادق عليه، مما يضمن الأمان.

## كيفية التطبيق

### 1. إعادة تشغيل الخادم
```bash
php artisan serve
```

### 2. اختبار النظام
- جرب إنشاء سجل جديد في أي جدول
- جرب تحديث سجل موجود
- تأكد من إضافة `company_id` تلقائياً

### 3. التحقق من قاعدة البيانات
تأكد من حفظ `company_id` في قاعدة البيانات.

## الخلاصة

تم تطبيق تحديث شامل في `DynamicTableController` يضيف `company_id` تلقائياً إلى:

- **إنشاء السجلات الجديدة**: عملية واحدة مع `company_id`
- **تحديث السجلات الموجودة**: عملية واحدة مع `company_id`
- **جميع الجداول**: التي تحتوي على عمود `company_id`

النتيجة: أداء أفضل، أخطاء أقل، وأمان أكبر! 🎉

## الكود الكامل للتحديث

```php
// في دالة store
$company_id = $this->getCompanyId($request);
if ($company_id !== null && $this->tableHasCompanyId($table)) {
    $processedData['company_id'] = $company_id;
}

// في دالة update
$company_id = $this->getCompanyId($request);
if ($company_id !== null && $this->tableHasCompanyId($table)) {
    $processedData['company_id'] = $company_id;
}

// دالة التحقق
public function tableHasCompanyId(string $table): bool
{
    try {
        return Schema::hasColumn($table, 'company_id');
    } catch (\Exception $e) {
        return false;
    }
}
```

