# دليل استخدام نظام الروات (Routes) في LaraCore

## 📋 نظرة عامة

نظام الروات في LaraCore يوفر إدارة شاملة للمسارات (Routes) لكل من الويب (Web) والـ API، مع دعم كامل للتخصيص والتوسيع.

## 🚀 الميزات

- ✅ **Web Routes** - مسارات الويب مع middleware و CSRF protection
- ✅ **API Routes** - مسارات API مع versioning و authentication
- ✅ **Route Groups** - تجميع المسارات في مجموعات منطقية
- ✅ **Route Caching** - تخزين مؤقت للمسارات لتحسين الأداء
- ✅ **Rate Limiting** - تحديد معدل الطلبات
- ✅ **Console Commands** - أوامر Artisan لإدارة المسارات
- ✅ **Helper Functions** - دوال مساعدة لإنشاء URLs

## 🔧 التثبيت والإعداد

### 1. تسجيل Service Provider

البكج يسجل نفسه تلقائياً في `CoreServiceProvider`.

### 2. تحميل المسارات

```php
// في CoreServiceProvider
public function boot(): void
{
    // تحميل مسارات الويب
    $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
    
    // تحميل مسارات API
    $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
}
```

## 🌐 Web Routes

### هيكل المسارات

```php
// routes/web.php
Route::get('/example', [ExampleController::class, 'index'])
    ->name('laracore.example.index');

Route::get('/example/create', [ExampleController::class, 'create'])
    ->name('laracore.example.create');

Route::post('/example', [ExampleController::class, 'store'])
    ->name('laracore.example.store');
```

### المسارات المتاحة

| المسار | الطريقة | الاسم | الوصف |
|--------|----------|-------|--------|
| `/laracore/example` | GET | `laracore.example.index` | عرض قائمة الأمثلة |
| `/laracore/example/create` | GET | `laracore.example.create` | نموذج إنشاء جديد |
| `/laracore/example` | POST | `laracore.example.store` | حفظ مثال جديد |
| `/laracore/example/{id}` | GET | `laracore.example.show` | عرض مثال محدد |
| `/laracore/example/{id}/edit` | GET | `laracore.example.edit` | نموذج تعديل |
| `/laracore/example/{id}` | PUT | `laracore.example.update` | تحديث مثال |
| `/laracore/example/{id}` | DELETE | `laracore.example.destroy` | حذف مثال |

### مسارات Helpers

```php
// مسارات لعرض قدرات Helpers
Route::get('/helpers/price', function () {
    $helpers = app('laracore.helpers');
    return [
        'formatted_price' => $helpers->price()->format(100.50, 'SAR'),
        'percentage' => $helpers->price()->percentage(25, 100),
        'discount' => $helpers->price()->discount(100, 20),
        'final_price' => $helpers->price()->finalPrice(100, 20)
    ];
})->name('laracore.helpers.price');
```

## 📡 API Routes

### هيكل المسارات

```php
// routes/api.php
Route::prefix('examples')->group(function () {
    Route::get('/', [ExampleApiController::class, 'index']);
    Route::post('/', [ExampleApiController::class, 'store']);
    Route::get('/{id}', [ExampleApiController::class, 'show']);
    Route::put('/{id}', [ExampleApiController::class, 'update']);
    Route::delete('/{id}', [ExampleApiController::class, 'destroy']);
});
```

### المسارات المتاحة

| المسار | الطريقة | الاسم | الوصف |
|--------|----------|-------|--------|
| `/api/v1/laracore/examples` | GET | `api.examples.index` | قائمة الأمثلة |
| `/api/v1/laracore/examples` | POST | `api.examples.store` | إنشاء مثال جديد |
| `/api/v1/laracore/examples/{id}` | GET | `api.examples.show` | عرض مثال محدد |
| `/api/v1/laracore/examples/{id}` | PUT | `api.examples.update` | تحديث مثال |
| `/api/v1/laracore/examples/{id}` | DELETE | `api.examples.destroy` | حذف مثال |

### مسارات Helpers API

```php
// مسارات API لعرض قدرات Helpers
Route::prefix('helpers')->group(function () {
    Route::get('/price', function () {
        $helpers = app('laracore.helpers');
        return response()->json([
            'status' => true,
            'data' => [
                'formatted_price' => $helpers->price()->format(100.50, 'SAR'),
                'percentage' => $helpers->price()->percentage(25, 100)
            ]
        ]);
    });
});
```

### مسار Health Check

```php
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'package' => 'LaraCore',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});
```

## 🛠️ Helper Functions

### دوال إنشاء URLs

```php
// إنشاء URL لمسار محدد
$url = laracore_route('example.show', ['id' => 1]);
// النتيجة: /laracore/example/1

// إنشاء URL لمسار API
$apiUrl = laracore_api_route('examples.show', ['id' => 1]);
// النتيجة: /api/v1/laracore/examples/1

// إنشاء URL أساسي للبكج
$webUrl = laracore_web_url('dashboard');
// النتيجة: http://localhost/laracore/dashboard

// إنشاء URL للـ API
$apiBaseUrl = laracore_api_url('examples');
// النتيجة: http://localhost/api/v1/laracore/examples

// إنشاء URL للأصول
$assetUrl = laracore_asset('css/app.css');
// النتيجة: http://localhost/vendor/laracore/css/app.css
```

### استخدام في Controllers

```php
<?php

namespace App\Http\Controllers;

use LaraCore\Facades\Helpers;

class ProductController extends Controller
{
    public function show(Product $product)
    {
        $data = [
            'product' => $product,
            'formatted_price' => Helpers::price()->format($product->price, 'SAR'),
            'edit_url' => laracore_route('example.edit', ['id' => $product->id]),
            'api_url' => laracore_api_route('examples.show', ['id' => $product->id])
        ];
        
        return view('products.show', $data);
    }
}
```

### استخدام في Views

```php
{{-- في Blade templates --}}
<a href="{{ laracore_route('example.show', ['id' => $product->id]) }}">
    عرض المنتج
</a>

<a href="{{ laracore_api_route('examples.show', ['id' => $product->id]) }}">
    API Link
</a>

<img src="{{ laracore_asset('images/logo.png') }}" alt="Logo">
```

## ⚙️ التكوين (Configuration)

### ملف config/routes.php

```php
return [
    // تكوين مسارات الويب
    'web' => [
        'prefix' => 'laracore',
        'middleware' => ['web'],
        'namespace' => 'LaraCore\Http\Controllers',
        'as' => 'laracore.',
    ],

    // تكوين مسارات API
    'api' => [
        'prefix' => 'api/v1/laracore',
        'middleware' => ['api'],
        'namespace' => 'LaraCore\Http\Controllers\Api',
        'as' => 'api.laracore.',
    ],

    // تكوين مجموعات المسارات
    'groups' => [
        'examples' => [
            'prefix' => 'examples',
            'as' => 'examples.',
        ],
        'helpers' => [
            'prefix' => 'helpers',
            'as' => 'helpers.',
        ],
    ],

    // تكوين التخزين المؤقت
    'cache' => [
        'enabled' => env('LARACORE_ROUTES_CACHE', false),
        'ttl' => env('LARACORE_ROUTES_CACHE_TTL', 3600),
    ],

    // تكوين تحديد معدل الطلبات
    'rate_limit' => [
        'enabled' => env('LARACORE_RATE_LIMIT', true),
        'max_attempts' => env('LARACORE_RATE_LIMIT_MAX', 60),
        'decay_minutes' => env('LARACORE_RATE_LIMIT_DECAY', 1),
    ],
];
```

### متغيرات البيئة

```bash
# .env
LARACORE_ROUTES_CACHE=true
LARACORE_ROUTES_CACHE_TTL=7200
LARACORE_RATE_LIMIT=true
LARACORE_RATE_LIMIT_MAX=100
LARACORE_RATE_LIMIT_DECAY=1
```

## 🎯 Console Commands

### أمر عرض المسارات

```bash
# عرض جميع مسارات LaraCore
php artisan laracore:routes

# عرض مسارات الويب فقط
php artisan laracore:routes --type=web

# عرض مسارات API فقط
php artisan laracore:routes --type=api
```

### مثال على المخرجات

```
LaraCore Package Routes
=====================
+--------+--------------------------------+------------------------+----------------------------------+
| Method | URI                            | Name                  | Action                          |
+--------+--------------------------------+------------------------+----------------------------------+
| GET    | laracore/example              | laracore.example.index| LaraCore\Controllers\Example... |
| GET    | laracore/example/create       | laracore.example.create| LaraCore\Controllers\Example... |
| POST   | laracore/example              | laracore.example.store| LaraCore\Controllers\Example... |
| GET    | api/v1/laracore/examples      | api.examples.index    | LaraCore\Controllers\Api\Exa... |
| POST   | api/v1/laracore/examples      | api.examples.store    | LaraCore\Controllers\Api\Exa... |
+--------+--------------------------------+------------------------+----------------------------------+
Total routes: 5
```

## 🔒 Middleware

### LaraCoreMiddleware

```php
<?php

namespace LaraCore\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LaraCoreMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // إضافة headers خاصة بالبكج
        $response->headers->set('X-Package', 'LaraCore');
        $response->headers->set('X-Package-Version', '1.0.0');
        
        return $response;
    }
}
```

### تسجيل Middleware

```php
// في bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'laracore' => \LaraCore\Http\Middleware\LaraCoreMiddleware::class,
    ]);
})
```

## 📚 أمثلة عملية

### 1. إنشاء Controller جديد

```php
<?php

namespace LaraCore\Http\Controllers;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return view('laracore::products.index');
    }

    public function show($id)
    {
        return view('laracore::products.show', compact('id'));
    }
}
```

### 2. إضافة مسارات جديدة

```php
// في routes/web.php
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index'])
        ->name('laracore.products.index');
    
    Route::get('/{id}', [ProductController::class, 'show'])
        ->name('laracore.products.show');
});
```

### 3. استخدام في التطبيق الرئيسي

```php
// في routes/web.php للتطبيق الرئيسي
Route::prefix('admin')->group(function () {
    // استخدام مسارات LaraCore
    Route::get('/examples', function () {
        return redirect(laracore_route('example.index'));
    });
    
    // أو استخدام مسارات API
    Route::get('/api-examples', function () {
        return redirect(laracore_api_route('examples.index'));
    });
});
```

## 🚨 استكشاف الأخطاء

### مشكلة: المسارات لا تظهر

```bash
# تأكد من تحميل المسارات
composer dump-autoload

# تحقق من تسجيل Service Provider
php artisan package:discover

# عرض جميع المسارات
php artisan route:list | grep laracore
```

### مشكلة: URLs لا تعمل

```php
// تأكد من استخدام الدوال الصحيحة
$url = laracore_route('example.show', ['id' => 1]);
$apiUrl = laracore_api_route('examples.show', ['id' => 1]);

// تحقق من أسماء المسارات
php artisan route:list --name=laracore
php artisan route:list --name=api
```

### مشكلة: Middleware لا يعمل

```bash
# تأكد من تسجيل Middleware
php artisan route:list --middleware=laracore

# تحقق من تكوين Middleware
php artisan config:show middleware
```

## 🎉 الخلاصة

نظام الروات في LaraCore يوفر:

- **إدارة شاملة** للمسارات (Web + API)
- **تخصيص كامل** من خلال ملفات التكوين
- **دوال مساعدة** لإنشاء URLs بسهولة
- **أوامر Artisan** لإدارة المسارات
- **Middleware مخصص** لإضافة headers ووظائف خاصة
- **تخزين مؤقت** و **Rate Limiting** لتحسين الأداء
- **توثيق شامل** مع أمثلة عملية

للحصول على مساعدة إضافية، راجع ملفات README.md و install.md أو تواصل مع فريق التطوير.
