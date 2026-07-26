# Laravel Easy DB - API Examples

## Base URL
```
http://127.0.0.1:8000/api/tables
```

## 1. إنشاء سجل جديد (Create) - POST /

### PowerShell Examples:

#### إنشاء منتج مع علاقات
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "products", "data": {"name": "iPhone 15", "price": "999", "category_id": 1, "supplier_id": 2, "brand": "Apple"}}'
```

#### إنشاء عميل
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "customers", "data": {"name": "أحمد محمد", "email": "ahmed@example.com", "phone": "123456789", "city": "الرياض"}}'
```

#### إنشاء طلب مع علاقات متعددة
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "orders", "data": {"customer_id": 1, "product_id": 2, "quantity": 5, "total_price": "500", "order_date": "2025-08-22"}}'
```

#### إنشاء فئة
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "categories", "data": {"name": "Electronics", "description": "Electronic devices and gadgets"}}'
```

### cURL Examples:

#### إنشاء منتج
```bash
curl -X POST http://127.0.0.1:8000/api/tables \
  -H "Content-Type: application/json" \
  -d '{"table": "products", "data": {"name": "Samsung Galaxy", "price": "800", "category_id": 1, "brand": "Samsung"}}'
```

#### إنشاء مورد
```bash
curl -X POST http://127.0.0.1:8000/api/tables \
  -H "Content-Type: application/json" \
  -d '{"table": "suppliers", "data": {"name": "Tech Supplier", "contact_email": "info@techsupplier.com", "phone": "987654321"}}'
```

## 2. قراءة جميع السجلات (Read All) - GET /

### PowerShell Examples:

#### الحصول على جميع المنتجات
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables?table=products" -Method GET
```

#### الحصول على جميع العملاء
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables?table=customers" -Method GET
```

#### الحصول على جميع الطلبات
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables?table=orders" -Method GET
```

### cURL Examples:

#### الحصول على جميع الفئات
```bash
curl -X GET "http://127.0.0.1:8000/api/tables?table=categories"
```

#### الحصول على جميع الموردين
```bash
curl -X GET "http://127.0.0.1:8000/api/tables?table=suppliers"
```

## 3. قراءة سجل واحد (Read Single) - GET /{id}

### PowerShell Examples:

#### الحصول على منتج محدد
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/2?table=products" -Method GET
```

#### الحصول على عميل محدد
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1?table=customers" -Method GET
```

#### الحصول على طلب محدد
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1?table=orders" -Method GET
```

### cURL Examples:

#### الحصول على فئة محددة
```bash
curl -X GET "http://127.0.0.1:8000/api/tables/1?table=categories"
```

#### الحصول على مورد محدد
```bash
curl -X GET "http://127.0.0.1:8000/api/tables/1?table=suppliers"
```

## 4. تحديث سجل (Update) - PUT /{id}

### PowerShell Examples:

#### تحديث منتج
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1" -Method PUT -ContentType "application/json" -Body '{"table": "products", "data": {"name": "iPhone 15 Pro", "price": "1199", "category_id": 1, "brand": "Apple"}}'
```

#### تحديث عميل
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1" -Method PUT -ContentType "application/json" -Body '{"table": "customers", "data": {"name": "أحمد محمد السعد", "email": "ahmed.new@example.com", "phone": "123456789", "city": "جدة"}}'
```

#### تحديث طلب
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1" -Method PUT -ContentType "application/json" -Body '{"table": "orders", "data": {"customer_id": 1, "product_id": 2, "quantity": 10, "total_price": "1000", "status": "completed"}}'
```

### cURL Examples:

#### تحديث فئة
```bash
curl -X PUT http://127.0.0.1:8000/api/tables/1 \
  -H "Content-Type: application/json" \
  -d '{"table": "categories", "data": {"name": "Smart Electronics", "description": "Smart electronic devices and IoT gadgets"}}'
```

#### تحديث مورد
```bash
curl -X PUT http://127.0.0.1:8000/api/tables/1 \
  -H "Content-Type: application/json" \
  -d '{"table": "suppliers", "data": {"name": "Advanced Tech Supplier", "contact_email": "sales@advancedtech.com", "phone": "987654321"}}'
```

## 5. حذف سجل (Delete) - DELETE /{id}

### PowerShell Examples:

#### حذف منتج
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1?table=products" -Method DELETE
```

#### حذف عميل
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1?table=customers" -Method DELETE
```

#### حذف طلب
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables/1?table=orders" -Method DELETE
```

### cURL Examples:

#### حذف فئة
```bash
curl -X DELETE "http://127.0.0.1:8000/api/tables/1?table=categories"
```

#### حذف مورد
```bash
curl -X DELETE "http://127.0.0.1:8000/api/tables/1?table=suppliers"
```

## أمثلة متقدمة

### إنشاء جداول مع علاقات معقدة

#### جدول الموظفين مع علاقات متعددة
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "employees", "data": {"name": "سارة أحمد", "department_id": 1, "manager_id": 2, "position": "مطور", "salary": "8000", "hire_date": "2025-01-15"}}'
```

#### جدول المشاريع
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "projects", "data": {"name": "تطوير تطبيق الجوال", "client_id": 1, "manager_id": 2, "budget": "50000", "start_date": "2025-02-01", "end_date": "2025-06-01"}}'
```

#### جدول المهام
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/tables" -Method POST -ContentType "application/json" -Body '{"table": "tasks", "data": {"title": "تصميم واجهة المستخدم", "section_id ": 1, "employee_id": 1, "status": "in_progress", "due_date": "2025-03-15"}}'
```

## استجابات API

### استجابة نجح الإنشاء
```json
{
  "success": true,
  "message": "تمت إضافة سجل جديد في جدول 'products'",
  "id": 1,
  "data": {
    "name": "iPhone 15",
    "price": "999",
    "category_id": 1,
    "brand": "Apple"
  }
}
```

### استجابة قراءة البيانات
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "iPhone 15",
      "price": "999",
      "category_id": 1,
      "brand": "Apple",
      "created_at": "2025-08-22T04:30:15.000000Z",
      "updated_at": "2025-08-22T04:30:15.000000Z"
    }
  ]
}
```

### استجابة خطأ
```json
{
  "success": false,
  "message": "الجدول 'nonexistent' غير موجود"
}
```

## ملاحظات مهمة

1. **العلاقات التلقائية**: أي حقل ينتهي بـ `_id` سيتم إنشاء علاقة `belongsTo` له تلقائياً
2. **إنشاء الجداول**: الجداول يتم إنشاؤها تلقائياً عند أول إدراج
3. **إضافة الأعمدة**: الأعمدة الجديدة تُضاف تلقائياً عند الحاجة
4. **تحديث المودل**: العلاقات الجديدة تُضاف للمودل دون حذف السابقة
5. **التوقيتات**: جميع الجداول تحتوي على `created_at` و `updated_at` تلقائياً
