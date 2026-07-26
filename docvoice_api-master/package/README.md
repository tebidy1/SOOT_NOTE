# LaraCore Package

Core package containing Master Controller, Model, Trait, and Helper classes for Laravel applications.

## Installation

```bash
composer require laracore/core
```

## Features

### HelperManager System

The package provides a comprehensive helper management system with the following components:

#### 1. HelperManager Class
```php
use LaraCore\Helpers\HelperManager;

$helpers = app('laracore.helpers');

// Access specific helpers
$priceHelper = $helpers->price();
$fileHelper = $helpers->file();
$userHelper = $helpers->user();
```

#### 2. Individual Helper Classes

##### PriceHelper
```php
// Format price
$formatted = $priceHelper->format(100.50, 'SAR'); // "100.50 SAR"

// Calculate percentage
$percentage = $priceHelper->percentage(25, 100); // 25.0

// Calculate discount
$discount = $priceHelper->discount(100, 20); // 20.0

// Final price after discount
$finalPrice = $priceHelper->finalPrice(100, 20); // 80.0
```

##### FileHelper
```php
// Get file extension
$extension = $fileHelper->getExtension('document.pdf'); // "pdf"

// Format file size
$size = $fileHelper->formatSize(1048576); // "1.0 MB"

// Check if file is image
$isImage = $fileHelper->isImage('photo.jpg'); // true

// Generate unique filename
$uniqueName = $fileHelper->uniqueName('document.pdf'); // "document_64a1b2c3d4e5f.pdf"
```

##### UserHelper
```php
// Get user initials
$initials = $userHelper->getInitials('John Doe'); // "JD"

// Mask email
$maskedEmail = $userHelper->maskEmail('john.doe@example.com'); // "j***e@example.com"

// Mask phone
$maskedPhone = $userHelper->maskPhone('0501234567'); // "05****67"

// Calculate age
$age = $userHelper->getAge('1990-01-01'); // 34

// Check if adult
$isAdult = $userHelper->isAdult('1990-01-01'); // true
```

#### 3. Global Helper Functions

The package also provides global helper functions for easy access:

```php
// Price helpers
format_price(100.50, 'SAR'); // "100.50 SAR"

// File helpers
format_file_size(1048576); // "1.0 MB"

// User helpers
get_user_initials('John Doe'); // "JD"

// Direct access to helper instances
laracore_price()->format(100.50);
laracore_file()->formatSize(1048576);
laracore_user()->getInitials('John Doe');
```

#### 4. Facade Usage

```php
use LaraCore\Facades\Helpers;

// Access helpers through facade
$priceHelper = Helpers::price();
$fileHelper = Helpers::file();
$userHelper = Helpers::user();

// Use helper methods directly
$formatted = Helpers::price()->format(100.50);
$size = Helpers::file()->formatSize(1048576);
$initials = Helpers::user()->getInitials('John Doe');
```

## Service Provider

The package automatically registers the `CoreServiceProvider` which:

- Registers the `HelperManager` as a singleton with the key `laracore.helpers`
- Sets up the `Helpers` facade
- Creates aliases for easy access

## Configuration

No additional configuration is required. The package works out of the box after installation.

## Extending

You can extend the helper system by:

1. Creating new helper classes in the `src/Helpers/` directory
2. Adding them to the `HelperManager` class
3. Creating corresponding global functions in `src/helpers.php`

## License

This package is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
