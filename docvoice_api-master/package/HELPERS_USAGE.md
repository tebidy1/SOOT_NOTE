# دليل استخدام الهلبر (Helpers) في LaraCore

## 📋 نظرة عامة

هذا الدليل يوضح كيفية استخدام نظام الهلبر (Helper System) في حزمة LaraCore. النظام يوفر مجموعة من الأدوات المساعدة للتعامل مع المهام الشائعة في التطبيقات.

## 🚀 التثبيت والإعداد

### 1. تثبيت البكج
```bash
composer require laracore/core
```

### 2. التأكد من التسجيل التلقائي
البكج يسجل نفسه تلقائياً في `CoreServiceProvider`، لذا لا تحتاج لإعدادات إضافية.

## 🔧 طرق الاستخدام

### الطريقة الأولى: استخدام Facade (الأسهل)

```php
use LaraCore\Facades\Helpers;

// استخدام Price Helper
$formattedPrice = Helpers::price()->format(100.50, 'SAR');

// استخدام File Helper
$fileSize = Helpers::file()->formatSize(1048576);

// استخدام User Helper
$initials = Helpers::user()->getInitials('أحمد محمد');
```

### الطريقة الثانية: استخدام Service Container

```php
// الحصول على HelperManager
$helpers = app('laracore.helpers');

// استخدام Helpers
$priceHelper = $helpers->price();
$fileHelper = $helpers->file();
$userHelper = $helpers->user();
```

### الطريقة الثالثة: استخدام Global Functions

```php
// دوال مساعدة عالمية
format_price(100.50, 'SAR');
format_file_size(1048576);
get_user_initials('أحمد محمد');

// أو استخدام الدوال المباشرة
laracore_price()->format(100.50);
laracore_file()->formatSize(1048576);
laracore_user()->getInitials('أحمد محمد');
```

## 💰 Price Helper (هلبر الأسعار)

### تنسيق الأسعار
```php
use LaraCore\Facades\Helpers;

// تنسيق سعر بالعملة
$price = Helpers::price()->format(1500.75, 'SAR');
// النتيجة: "1,500.75 SAR"

// تنسيق سعر بالدولار
$price = Helpers::price()->format(99.99, 'USD');
// النتيجة: "99.99 USD"

// تنسيق سعر باليورو
$price = Helpers::price()->format(250.50, 'EUR');
// النتيجة: "250.50 EUR"
```

### حساب النسب المئوية
```php
// حساب نسبة من إجمالي
$percentage = Helpers::price()->percentage(25, 100);
// النتيجة: 25.0

// حساب نسبة الخصم
$discountPercentage = Helpers::price()->percentage(20, 100);
// النتيجة: 20.0

// حساب نسبة الضريبة
$taxPercentage = Helpers::price()->percentage(15, 1000);
// النتيجة: 1.5
```

### حساب الخصومات
```php
// حساب مبلغ الخصم
$discountAmount = Helpers::price()->discount(100, 20);
// النتيجة: 20.0 (خصم 20% من 100)

// حساب السعر النهائي بعد الخصم
$finalPrice = Helpers::price()->finalPrice(100, 20);
// النتيجة: 80.0 (السعر بعد خصم 20%)

// مثال عملي
$originalPrice = 500;
$discountPercent = 15;
$discount = Helpers::price()->discount($originalPrice, $discountPercent);
$finalPrice = Helpers::price()->finalPrice($originalPrice, $discountPercent);

echo "السعر الأصلي: " . Helpers::price()->format($originalPrice, 'SAR') . "\n";
echo "مبلغ الخصم: " . Helpers::price()->format($discount, 'SAR') . "\n";
echo "السعر النهائي: " . Helpers::price()->format($finalPrice, 'SAR') . "\n";
```

## 📁 File Helper (هلبر الملفات)

### معلومات الملف
```php
use LaraCore\Facades\Helpers;

// الحصول على امتداد الملف
$extension = Helpers::file()->getExtension('document.pdf');
// النتيجة: "pdf"

$extension = Helpers::file()->getExtension('photo.jpg');
// النتيجة: "jpg"

// الحصول على اسم الملف بدون امتداد
$name = Helpers::file()->getName('important_document.pdf');
// النتيجة: "important_document"
```

### تنسيق حجم الملف
```php
// تنسيق أحجام مختلفة
$size1 = Helpers::file()->formatSize(1024);
// النتيجة: "1.0 KB"

$size2 = Helpers::file()->formatSize(1048576);
// النتيجة: "1.0 MB"

$size3 = Helpers::file()->formatSize(1073741824);
// النتيجة: "1.0 GB"

$size4 = Helpers::file()->formatSize(500);
// النتيجة: "500.0 B"
```

### التحقق من نوع الملف
```php
// التحقق من أن الملف صورة
$isImage1 = Helpers::file()->isImage('photo.jpg');
// النتيجة: true

$isImage2 = Helpers::file()->isImage('document.pdf');
// النتيجة: false

$isImage3 = Helpers::file()->isImage('image.png');
// النتيجة: true

$isImage4 = Helpers::file()->isImage('video.mp4');
// النتيجة: false
```

### إنشاء أسماء فريدة
```php
// إنشاء اسم فريد للملف
$uniqueName1 = Helpers::file()->uniqueName('document.pdf');
// النتيجة: "document_64a1b2c3d4e5f.pdf"

$uniqueName2 = Helpers::file()->uniqueName('photo.jpg');
// النتيجة: "photo_64a1b2c3d4e5f.jpg"

// مثال عملي لرفع ملف
$originalFileName = $_FILES['upload']['name'];
$uniqueFileName = Helpers::file()->uniqueName($originalFileName);
$uploadPath = 'uploads/' . $uniqueFileName;
```

## 👤 User Helper (هلبر المستخدمين)

### الأحرف الأولى
```php
use LaraCore\Facades\Helpers;

// الحصول على الأحرف الأولى
$initials1 = Helpers::user()->getInitials('أحمد محمد علي');
// النتيجة: "أما"

$initials2 = Helpers::user()->getInitials('John Doe Smith');
// النتيجة: "JDS"

$initials3 = Helpers::user()->getInitials('محمد');
// النتيجة: "م"

$initials4 = Helpers::user()->getInitials('A B C');
// النتيجة: "ABC"
```

### إخفاء البريد الإلكتروني
```php
// إخفاء البريد الإلكتروني
$masked1 = Helpers::user()->maskEmail('ahmed@example.com');
// النتيجة: "a***d@example.com"

$masked2 = Helpers::user()->maskEmail('john.doe@company.org');
// النتيجة: "j***e@company.org"

$masked3 = Helpers::user()->maskEmail('a@test.com');
// النتيجة: "a@test.com" (لا يتم إخفاؤه إذا كان قصيراً)

$masked4 = Helpers::user()->maskEmail('user123@domain.co.uk');
// النتيجة: "u***3@domain.co.uk"
```

### إخفاء رقم الهاتف
```php
// إخفاء رقم الهاتف
$masked1 = Helpers::user()->maskPhone('0501234567');
// النتيجة: "05****67"

$masked2 = Helpers::user()->maskPhone('966501234567');
// النتيجة: "96******67"

$masked3 = Helpers::user()->maskPhone('1234');
// النتيجة: "1234" (لا يتم إخفاؤه إذا كان قصيراً)

$masked4 = Helpers::user()->maskPhone('+966501234567');
// النتيجة: "+9******67"
```

### حساب العمر
```php
// حساب العمر من تاريخ الميلاد
$age1 = Helpers::user()->getAge('1990-05-15');
// النتيجة: 34 (حسب السنة الحالية)

$age2 = Helpers::user()->getAge('2000-12-25');
// النتيجة: 24

$age3 = Helpers::user()->getAge('1985-03-10');
// النتيجة: 39

// التحقق من البلوغ
$isAdult1 = Helpers::user()->isAdult('1990-05-15');
// النتيجة: true

$isAdult2 = Helpers::user()->isAdult('2010-08-20');
// النتيجة: false

$isAdult3 = Helpers::user()->isAdult('2005-01-01', 21); // سن البلوغ 21
// النتيجة: false
```

## 🎯 أمثلة عملية في Controllers

### ProductController
```php
<?php

namespace App\Http\Controllers;

use LaraCore\Facades\Helpers;
use App\Models\Product;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        $product = Product::create($request->validated());
        
        // تنسيق السعر
        $formattedPrice = Helpers::price()->format($product->price, 'SAR');
        
        // حساب الخصم إذا كان موجوداً
        if ($product->discount_percentage > 0) {
            $discountAmount = Helpers::price()->discount($product->price, $product->discount_percentage);
            $finalPrice = Helpers::price()->finalPrice($product->price, $product->discount_percentage);
            
            $product->update([
                'discount_amount' => $discountAmount,
                'final_price' => $finalPrice
            ]);
        }
        
        return response()->json([
            'message' => 'تم إنشاء المنتج بنجاح',
            'product' => $product,
            'formatted_price' => $formattedPrice
        ]);
    }
    
    public function show(Product $product)
    {
        // تنسيق الأسعار
        $data = [
            'id' => $product->id,
            'name' => $product->name,
            'original_price' => Helpers::price()->format($product->price, 'SAR'),
            'final_price' => Helpers::price()->format($product->final_price, 'SAR'),
            'discount_percentage' => $product->discount_percentage . '%',
            'discount_amount' => Helpers::price()->format($product->discount_amount, 'SAR')
        ];
        
        return response()->json($data);
    }
}
```

### FileController
```php
<?php

namespace App\Http\Controllers;

use LaraCore\Facades\Helpers;
use Illuminate\Http\Request;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $file = $request->file('file');
        
        // التحقق من نوع الملف
        if (!Helpers::file()->isImage($file->getClientOriginalName())) {
            return response()->json([
                'error' => 'يجب أن يكون الملف صورة'
            ], 400);
        }
        
        // إنشاء اسم فريد
        $uniqueName = Helpers::file()->uniqueName($file->getClientOriginalName());
        
        // حفظ الملف
        $path = $file->storeAs('uploads', $uniqueName);
        
        // معلومات الملف
        $fileInfo = [
            'original_name' => $file->getClientOriginalName(),
            'unique_name' => $uniqueName,
            'extension' => Helpers::file()->getExtension($file->getClientOriginalName()),
            'size' => Helpers::file()->formatSize($file->getSize()),
            'path' => $path
        ];
        
        return response()->json([
            'message' => 'تم رفع الملف بنجاح',
            'file' => $fileInfo
        ]);
    }
}
```

### UserController
```php
<?php

namespace App\Http\Controllers;

use LaraCore\Facades\Helpers;
use App\Models\User;

class UserController extends Controller
{
    public function profile(User $user)
    {
        $profileData = [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => Helpers::user()->getInitials($user->name),
            'email' => $user->email,
            'masked_email' => Helpers::user()->maskEmail($user->email),
            'phone' => $user->phone,
            'masked_phone' => Helpers::user()->maskPhone($user->phone),
            'birth_date' => $user->birth_date,
            'age' => Helpers::user()->getAge($user->birth_date),
            'is_adult' => Helpers::user()->isAdult($user->birth_date)
        ];
        
        return response()->json($profileData);
    }
    
    public function update(Request $request, User $user)
    {
        $data = $request->validated();
        
        // تحديث المستخدم
        $user->update($data);
        
        // إرجاع البيانات المحدثة مع التنسيق
        return response()->json([
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'initials' => Helpers::user()->getInitials($user->name),
                'email' => $user->email,
                'masked_email' => Helpers::user()->maskEmail($user->email)
            ]
        ]);
    }
}
```

## 🎨 أمثلة في Views/Blade

### عرض المنتج
```php
{{-- عرض معلومات المنتج --}}
<div class="product-card">
    <h3>{{ $product->name }}</h3>
    
    <div class="price-info">
        @if($product->discount_percentage > 0)
            <span class="original-price">
                {{ format_price($product->price, 'SAR') }}
            </span>
            <span class="discount-badge">
                خصم {{ $product->discount_percentage }}%
            </span>
            <span class="final-price">
                {{ format_price($product->final_price, 'SAR') }}
            </span>
        @else
            <span class="price">
                {{ format_price($product->price, 'SAR') }}
            </span>
        @endif
    </div>
</div>
```

### عرض معلومات الملف
```php
{{-- عرض معلومات الملف --}}
<div class="file-info">
    <h4>{{ $file->original_name }}</h4>
    
    <div class="file-details">
        <p><strong>النوع:</strong> {{ $file->extension }}</p>
        <p><strong>الحجم:</strong> {{ format_file_size($file->size) }}</p>
        <p><strong>نوع الملف:</strong> 
            @if(\LaraCore\Facades\Helpers::file()->isImage($file->original_name))
                <span class="badge badge-success">صورة</span>
            @else
                <span class="badge badge-info">ملف</span>
            @endif
        </p>
    </div>
</div>
```

### عرض معلومات المستخدم
```php
{{-- عرض معلومات المستخدم --}}
<div class="user-profile">
    <div class="avatar">
        {{ get_user_initials($user->name) }}
    </div>
    
    <div class="user-details">
        <h3>{{ $user->name }}</h3>
        <p><strong>البريد الإلكتروني:</strong> {{ $user->masked_email }}</p>
        <p><strong>الهاتف:</strong> {{ $user->masked_phone }}</p>
        <p><strong>العمر:</strong> {{ $user->age }} سنة</p>
        <p><strong>الحالة:</strong> 
            @if($user->is_adult)
                <span class="badge badge-success">بالغ</span>
            @else
                <span class="badge badge-warning">قاصر</span>
            @endif
        </p>
    </div>
</div>
```

## 🔧 التوسيع وإضافة Helpers جديدة

### إنشاء DateHelper
```php
<?php

namespace LaraCore\Helpers;

class DateHelper
{
    /**
     * تنسيق التاريخ
     */
    public function formatDate(string $date, string $format = 'Y-m-d'): string
    {
        return date($format, strtotime($date));
    }
    
    /**
     * حساب الفرق بين تاريخين
     */
    public function dateDiff(string $date1, string $date2): int
    {
        $date1 = new \DateTime($date1);
        $date2 = new \DateTime($date2);
        $interval = $date1->diff($date2);
        
        return $interval->days;
    }
    
    /**
     * التحقق من أن التاريخ في المستقبل
     */
    public function isFuture(string $date): bool
    {
        return strtotime($date) > time();
    }
    
    /**
     * التحقق من أن التاريخ في الماضي
     */
    public function isPast(string $date): bool
    {
        return strtotime($date) < time();
    }
}
```

### إضافة DateHelper إلى HelperManager
```php
<?php

namespace LaraCore\Helpers;

class HelperManager
{
    protected $price;
    protected $file;
    protected $user;
    protected $date; // إضافة جديد

    public function price(): PriceHelper
    {
        return $this->price ??= new PriceHelper();
    }

    public function file(): FileHelper
    {
        return $this->file ??= new FileHelper();
    }

    public function user(): UserHelper
    {
        return $this->user ??= new UserHelper();
    }
    
    public function date(): DateHelper // دالة جديدة
    {
        return $this->date ??= new DateHelper();
    }
}
```

### إضافة Global Functions
```php
// في ملف src/helpers.php

if (!function_exists('laracore_date')) {
    function laracore_date()
    {
        return laracore_helpers()->date();
    }
}

if (!function_exists('format_date')) {
    function format_date(string $date, string $format = 'Y-m-d'): string
    {
        return laracore_date()->formatDate($date, $format);
    }
}

if (!function_exists('date_diff')) {
    function date_diff(string $date1, string $date2): int
    {
        return laracore_date()->dateDiff($date1, $date2);
    }
}

if (!function_exists('is_future_date')) {
    function is_future_date(string $date): bool
    {
        return laracore_date()->isFuture($date);
    }
}
```

## 🚨 استكشاف الأخطاء

### مشكلة: Class not found
```bash
# تأكد من تشغيل
composer dump-autoload
```

### مشكلة: Facade not working
تأكد من تسجيل Service Provider في `bootstrap/app.php`:
```php
->withProviders([
    \LaraCore\CoreServiceProvider::class,
])
```

### مشكلة: Global Functions not working
تأكد من تضمين ملف `helpers.php` في `composer.json`:
```json
"autoload": {
    "files": [
        "src/helpers.php"
    ]
}
```

## 📚 أفضل الممارسات

### 1. استخدام Facade في Controllers
```php
// ✅ صحيح
use LaraCore\Facades\Helpers;

$price = Helpers::price()->format(100.50, 'SAR');

// ❌ خطأ - لا تستخدم Service Container مباشرة
$price = app('laracore.helpers')->price()->format(100.50, 'SAR');
```

### 2. استخدام Global Functions في Views
```php
{{-- ✅ صحيح --}}
{{ format_price($product->price, 'SAR') }}

{{-- ❌ خطأ - لا تستخدم Facade في Views --}}
{{ \LaraCore\Facades\Helpers::price()->format($product->price, 'SAR') }}
```

### 3. إعادة استخدام النتائج
```php
// ✅ صحيح - إعادة استخدام النتيجة
$priceHelper = Helpers::price();
$formatted1 = $priceHelper->format(100, 'SAR');
$formatted2 = $priceHelper->format(200, 'SAR');

// ❌ خطأ - استدعاء متكرر
$formatted1 = Helpers::price()->format(100, 'SAR');
$formatted2 = Helpers::price()->format(200, 'SAR');
```

## 🎉 الخلاصة

نظام الهلبر في LaraCore يوفر:
- **سهولة الاستخدام** من خلال Facade و Global Functions
- **أداء عالي** مع Lazy Loading
- **مرونة في التوسيع** لإضافة helpers جديدة
- **توثيق شامل** مع أمثلة عملية
- **دعم كامل** للغة العربية

للحصول على مساعدة إضافية، راجع ملفات README.md و install.md أو تواصل مع فريق التطوير.
