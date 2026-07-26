# إصلاح نماذج البيانات - Dashboard System

## المشكلة الأصلية
كان هناك خطأ في العلاقات بين النماذج:
```
"حدث خطأ في جلب الإحصائيات: Call to undefined method App\\Models\\Driver::platformOrders()"
```

## السبب
نموذج `Driver` لم يكن يحتوي على:
1. علاقة `platformOrders()` مع `PlatformOrder`
2. حقل `company_id` في `fillable`
3. نماذج `PlatformOrder` و `PlatformOrderItem` لم تكن موجودة

## الحل المطبق

### 1. إنشاء نموذج PlatformOrderItem
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformOrderItem extends Model
{
    use HasFactory;

    protected $table = 'platform_orders_items';

    protected $fillable = [
        'driver_id',
        'platform_id',
        'orders',
        'status',
        'platform_order_id'
    ];

    protected $casts = [
        'orders' => 'integer',
        'platform_id' => 'integer',
        'driver_id' => 'integer',
        'platform_order_id' => 'integer'
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function platformOrder(): BelongsTo
    {
        return $this->belongsTo(PlatformOrder::class, 'platform_order_id');
    }
}
```

### 2. إنشاء نموذج PlatformOrder
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformOrder extends Model
{
    use HasFactory;

    protected $table = 'platform_orders';

    protected $fillable = [
        'status',
        'mappedDrivers',
        'totalDrivers',
        'totalOrders',
        'unmappedDrivers',
        'date',
        'company_id',
        'amount',
        'from_account_id',
        'beneficiary',
        'driver_id',
        'category',
        'notes',
        'invoice_url',
        'created_by'
    ];

    protected $casts = [
        'mappedDrivers' => 'integer',
        'totalDrivers' => 'integer',
        'totalOrders' => 'integer',
        'unmappedDrivers' => 'integer',
        'date' => 'date',
        'company_id' => 'integer'
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(PlatformOrderItem::class, 'platform_order_id');
    }

    public function drivers()
    {
        return $this->hasManyThrough(
            Driver::class,
            PlatformOrderItem::class,
            'platform_order_id',
            'id',
            'id',
            'driver_id'
        );
    }
}
```

### 3. تحديث نموذج Driver
```php
<?php

namespace App\Models;

use App\Traits\Filterable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Driver extends Model
{
    use HasFactory, Filterable;

    protected $fillable = [
        'company_id',
        'name',
        'phone',
        'email',
        'national_id',
        'license_number',
        'license_expiry',
        'salary',
        'status',
        'mobile_number',
        'driver_id',
        'nationality',
        'residence_number',
        'birth_date',
        'residence_expiry_date',
        'number',
        'group_id',
        'vehicle_id',
        'platformIds',
        'platform_ids',
        'history',
        'dailyTarget',
        'notes'
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'license_expiry' => 'date'
    ];

    // العلاقات الموجودة
    public function expenses()
    {
        return $this->hasMany(Transaction::class, 'driver_id')->where('type','expense');
    }

    public function advances()
    {
        return $this->hasMany(Transaction::class, 'driver_id')->where('type','advance');
    }

    public function driverPayrolls(): HasMany
    {
        return $this->hasMany(DriverPayroll::class);
    }

    // العلاقات الجديدة
    public function platformOrderItems(): HasMany
    {
        return $this->hasMany(PlatformOrderItem::class);
    }

    public function platformOrders()
    {
        return $this->hasManyThrough(
            PlatformOrder::class,
            PlatformOrderItem::class,
            'driver_id', // Foreign key on platform_order_items table
            'id', // Foreign key on platform_orders table
            'id', // Local key on drivers table
            'platform_order_id' // Local key on platform_order_items table
        );
    }

    // ... باقي الدوال
}
```

### 4. إصلاح تضارب الأعمدة في DashboardController
```php
public function getTopPerformingDrivers($companyId, string $period): array
{
    $dateFilter = $this->getDateFilter($period);
    
    return Driver::where('company_id', $companyId)
        ->withCount(['platformOrders as completed_orders' => function($query) use ($dateFilter) {
            $query->where('platform_orders.status', 'active')->whereBetween('platform_orders.created_at', $dateFilter);
        }])
        ->withSum(['platformOrders as total_revenue' => function($query) use ($dateFilter) {
            $query->where('platform_orders.status', 'active')->whereBetween('platform_orders.created_at', $dateFilter);
        }], DB::raw('CAST(platform_orders.amount AS DECIMAL(10,2))'))
        ->orderByDesc('completed_orders')
        ->limit(10)
        ->get(['id', 'name', 'mobile_number', 'completed_orders', 'total_revenue'])
        ->toArray();
}
```

## هيكل العلاقات

```
Driver (1) ←→ (N) PlatformOrderItem (N) ←→ (1) PlatformOrder
     ↑                                              ↑
     |                                              |
company_id                                    company_id
```

### العلاقات:
1. **Driver** → **PlatformOrderItem**: `hasMany` (من خلال `driver_id`)
2. **PlatformOrderItem** → **PlatformOrder**: `belongsTo` (من خلال `platform_order_id`)
3. **Driver** → **PlatformOrder**: `hasManyThrough` (علاقة غير مباشرة)

## الفوائد من هذا الحل

### 1. حل مشكلة العلاقات
- الآن يمكن استخدام `$driver->platformOrders` في الاستعلامات
- العلاقات تعمل بشكل صحيح مع `withCount` و `withSum`

### 2. تحسين الأداء
- استخدام `hasManyThrough` بدلاً من استعلامات منفصلة
- تقليل عدد الطلبات لقاعدة البيانات

### 3. مرونة أكبر
- يمكن الوصول للبيانات من أي اتجاه
- سهولة إضافة علاقات جديدة

### 4. توافق مع قاعدة البيانات
- النماذج تتطابق مع هيكل الجداول الفعلي
- العلاقات تستخدم المفاتيح الأجنبية الصحيحة

## ملاحظات مهمة

1. **تأكد من وجود جميع النماذج** في `app/Models/`
2. **أعد تشغيل الخادم** بعد إضافة النماذج الجديدة
3. **تأكد من أن `company_id` موجود** في جميع الجداول
4. **استخدم أسماء الجداول الصحيحة** في الاستعلامات لتجنب تضارب الأعمدة

## الخلاصة

تم حل مشكلة نماذج البيانات بنجاح من خلال:
- إنشاء نماذج `PlatformOrder` و `PlatformOrderItem`
- إضافة العلاقات الصحيحة في نموذج `Driver`
- إصلاح تضارب الأعمدة في الاستعلامات
- تحديث `fillable` ليشمل جميع الحقول المطلوبة

الآن يجب أن يعمل الداشبورد بدون أخطاء في النماذج! 🎉
