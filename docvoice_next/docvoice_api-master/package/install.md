# دليل تثبيت LaraCore Package

## المتطلبات

- PHP 8.2+
- Laravel 12+

## التثبيت

### 1. إضافة البكج إلى composer.json

```json
{
    "require": {
        "laracore/core": "*"
    },
    "repositories": [
        {
            "type": "path",
            "url": "./package"
        }
    ]
}
```

### 2. تثبيت البكج

```bash
composer require laracore/core
```

### 3. تسجيل Service Provider

البكج يسجل نفسه تلقائياً في `CoreServiceProvider`.

## الاستخدام

### HelperManager System

#### استخدام مباشر

```php
use LaraCore\Helpers\HelperManager;

$helpers = app('laracore.helpers');

// Price Helper
$priceHelper = $helpers->price();
$formatted = $priceHelper->format(100.50, 'SAR');

// File Helper
$fileHelper = $helpers->file();
$size = $fileHelper->formatSize(1048576);

// User Helper
$userHelper = $helpers->user();
$initials = $userHelper->getInitials('John Doe');
```

#### استخدام Facade

```php
use LaraCore\Facades\Helpers;

$formatted = Helpers::price()->format(100.50);
$size = Helpers::file()->formatSize(1048576);
$initials = Helpers::user()->getInitials('John Doe');
```

#### استخدام Global Functions

```php
// Price helpers
format_price(100.50, 'SAR');

// File helpers
format_file_size(1048576);

// User helpers
get_user_initials('John Doe');

// Direct access
laracore_price()->format(100.50);
laracore_file()->formatSize(1048576);
laracore_user()->getInitials('John Doe');
```

### أمثلة عملية

#### في Controllers

```php
<?php

namespace App\Http\Controllers;

use LaraCore\Facades\Helpers;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        $product = Product::create($request->validated());
        
        // استخدام Price Helper
        $formattedPrice = Helpers::price()->format($product->price, 'SAR');
        
        return response()->json([
            'message' => 'تم إنشاء المنتج بنجاح',
            'price' => $formattedPrice
        ]);
    }
}
```

#### في Models

```php
<?php

namespace App\Models;

use LaraCore\Facades\Helpers;

class User extends Authenticatable
{
    public function getInitialsAttribute()
    {
        return Helpers::user()->getInitials($this->name);
    }
    
    public function getMaskedEmailAttribute()
    {
        return Helpers::user()->maskEmail($this->email);
    }
}
```

#### في Views/Blade

```php
{{-- استخدام Global Functions --}}
<p>السعر: {{ format_price($product->price, 'SAR') }}</p>
<p>حجم الملف: {{ format_file_size($file->size) }}</p>
<p>الأحرف الأولى: {{ get_user_initials($user->name) }}</p>

{{-- أو استخدام Facade --}}
<p>السعر: {{ \LaraCore\Facades\Helpers::price()->format($product->price, 'SAR') }}</p>
```

## التوسيع

### إضافة Helper جديد

1. أنشئ class جديد في `src/Helpers/`

```php
<?php

namespace LaraCore\Helpers;

class DateHelper
{
    public function formatDate(string $date, string $format = 'Y-m-d'): string
    {
        return date($format, strtotime($date));
    }
}
```

2. أضفه إلى `HelperManager`

```php
class HelperManager
{
    protected $date;
    
    public function date(): DateHelper
    {
        return $this->date ??= new DateHelper();
    }
}
```

3. أضف global function في `src/helpers.php`

```php
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
```

## استكشاف الأخطاء

### مشكلة: Class not found

تأكد من تشغيل:
```bash
composer dump-autoload
```

### مشكلة: Facade not working

تأكد من تسجيل Service Provider في `bootstrap/app.php`:

```php
->withProviders([
    \LaraCore\CoreServiceProvider::class,
])
```

## الدعم

للمساعدة والدعم، يرجى التواصل مع فريق التطوير.
