# API المحادثات المترابطة (Threads API)

## نظرة عامة

تم إنشاء كنترولر منفصل `ThreadController` و API خاص لصفحة المحادثات المترابطة. هذا الـ API يتعامل مع الرسائل التي لها ردود (threads) ويوفر عمليات CRUD كاملة للردود.

## الملفات المنشأة

### 1. ThreadController
- **المسار**: `backend/app/Http/Controllers/ThreadController.php`
- **الوظيفة**: كنترولر منفصل لإدارة المحادثات المترابطة

### 2. ThreadResource
- **المسار**: `backend/app/Http/Resources/ThreadResource.php`
- **الوظيفة**: تحويل بيانات المحادثات المترابطة إلى تنسيق JSON مناسب

### 3. ThreadRequest
- **المسار**: `backend/app/Http/Requests/ThreadRequest.php`
- **الوظيفة**: التحقق من صحة البيانات المرسلة للـ API

### 4. Routes
- **المسار**: `backend/routes/api.php`
- **الوظيفة**: إضافة مسارات API للمحادثات المترابطة

## مسارات API

### 1. جلب جميع المحادثات المترابطة
```
GET /api/threads
```

**المعاملات**:
- `workspace_id` (مطلوب): معرف مساحة العمل
- `per_page` (اختياري): عدد العناصر في الصفحة (افتراضي: 20)
- `page` (اختياري): رقم الصفحة (افتراضي: 1)

**مثال**:
```bash
GET /api/threads?workspace_id=1&per_page=10&page=1
```

**الاستجابة**:
```json
{
  "success": true,
  "message": "تم جلب المحادثات المترابطة بنجاح",
  "data": {
    "data": [
      {
        "id": 1,
        "text": "نص الرسالة الأصلية",
        "timestamp": "14:30",
        "date": "2024-01-15",
        "user": {
          "id": 1,
          "name": "اسم المستخدم",
          "avatar": "path/to/avatar.jpg"
        },
        "channel": {
          "id": 1,
          "name": "اسم القناة",
          "workspace_id": 1
        },
        "thread": [
          {
            "id": 2,
            "text": "نص الرد",
            "timestamp": "14:35",
            "date": "2024-01-15",
            "user": {
              "id": 2,
              "name": "اسم المستخدم الثاني",
              "avatar": "path/to/avatar2.jpg"
            },
            "reactions": []
          }
        ],
        "reactions": [],
        "replies_count": 1
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 10,
      "total": 50,
      "from": 1,
      "to": 10
    }
  }
}
```

### 2. عرض محادثة مترابطة محددة
```
GET /api/threads/{messageId}
```

**المعاملات**:
- `messageId` (مطلوب): معرف الرسالة الأصلية

**مثال**:
```bash
GET /api/threads/123
```

### 3. إضافة رد جديد
```
POST /api/threads/{messageId}/replies
```

**المعاملات**:
- `messageId` (مطلوب): معرف الرسالة الأصلية
- `text` (مطلوب): نص الرد
- `attachments` (اختياري): مصفوفة الملفات المرفقة

**مثال**:
```bash
POST /api/threads/123/replies
Content-Type: application/json

{
  "text": "هذا رد جديد على المحادثة"
}
```

### 4. تحديث رد
```
PUT /api/threads/{messageId}/replies/{replyId}
```

**المعاملات**:
- `messageId` (مطلوب): معرف الرسالة الأصلية
- `replyId` (مطلوب): معرف الرد
- `text` (مطلوب): النص الجديد

**مثال**:
```bash
PUT /api/threads/123/replies/456
Content-Type: application/json

{
  "text": "النص المحدث للرد"
}
```

### 5. حذف رد
```
DELETE /api/threads/{messageId}/replies/{replyId}
```

**المعاملات**:
- `messageId` (مطلوب): معرف الرسالة الأصلية
- `replyId` (مطلوب): معرف الرد

**مثال**:
```bash
DELETE /api/threads/123/replies/456
```

### 6. إحصائيات المحادثات المترابطة
```
GET /api/threads/statistics
```

**المعاملات**:
- `workspace_id` (مطلوب): معرف مساحة العمل

**مثال**:
```bash
GET /api/threads/statistics?workspace_id=1
```

**الاستجابة**:
```json
{
  "success": true,
  "message": "تم جلب إحصائيات المحادثات المترابطة بنجاح",
  "data": {
    "total_threads": 25,
    "active_threads_today": 5,
    "total_replies": 150,
    "most_active_channel": {
      "id": 1,
      "name": "القناة الأكثر نشاطاً",
      "messages_count": 10
    }
  }
}
```

## الميزات

### 1. الأمان
- جميع المسارات محمية بـ `auth:sanctum`
- التحقق من الصلاحيات عند التعديل أو الحذف
- فقط صاحب الرد أو المدير يمكنه تعديل/حذف الرد

### 2. التحقق من البيانات
- التحقق من صحة النص (1-2000 حرف)
- التحقق من المرفقات (حد أقصى 5 ملفات، 10MB لكل ملف)
- التحقق من وجود مساحة العمل

### 3. الأداء
- استخدام Eager Loading لتجنب مشكلة N+1
- ترقيم البيانات للصفحات الكبيرة
- فهرسة قاعدة البيانات للاستعلامات السريعة

### 4. المرونة
- دعم المرفقات في الردود
- دعم ردود الفعل (reactions)
- إحصائيات مفصلة

## الاستخدام في الواجهة الأمامية

يمكن استخدام هذا API في صفحة المحادثات المترابطة (`frontend/src/app/threads/page.tsx`) لاستبدال البيانات الثابتة ببيانات حقيقية من قاعدة البيانات.

### مثال على الاستخدام:

```typescript
// جلب جميع المحادثات المترابطة
const fetchThreads = async (workspaceId: number) => {
  const response = await fetch(`/api/threads?workspace_id=${workspaceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// إضافة رد جديد
const addReply = async (messageId: number, text: string) => {
  const response = await fetch(`/api/threads/${messageId}/replies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  return response.json();
};
```

## ملاحظات مهمة

1. **الترقيم**: جميع المسارات تدعم الترقيم للتعامل مع البيانات الكبيرة
2. **الترتيب**: المحادثات المترابطة مرتبة حسب آخر نشاط (آخر رد)
3. **العلاقات**: يتم تحميل جميع العلاقات المطلوبة (المستخدم، القناة، الردود، ردود الفعل)
4. **الأمان**: التحقق من الصلاحيات في كل عملية تعديل أو حذف
5. **الأداء**: استخدام Eager Loading لتجنب مشاكل الأداء

## التطوير المستقبلي

يمكن إضافة الميزات التالية في المستقبل:
- البحث في المحادثات المترابطة
- تصفية المحادثات حسب القناة أو المستخدم
- إشعارات عند إضافة ردود جديدة
- دعم المرفقات المتقدمة (صور، مستندات)
- تصدير المحادثات المترابطة
