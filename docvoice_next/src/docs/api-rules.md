---
description: 
globs: 
alwaysApply: true
---
# قواعد استخدام Base Service في المشروع

## القاعدة الأساسية
يجب استخدام `base.service.ts` لجميع عمليات API في المشروع. يُمنع منعاً باتاً إجراء طلبات HTTP مباشرة باستخدام Axios أو Fetch API خارج طبقة الخدمة (Service Layer).

## هيكلية الخدمات

### 1. موقع الخدمات
```
lib/
├── services/
│   ├── base.service.ts    # الخدمة الأساسية
│   └── api.service.ts     # تهيئة Axios/fetch
└── features/
    ├
    │    clients.service.ts       # خدمات المستخدمين
    |
    │    products.service.ts    # خدمات المنتجات
    └── ...                   # خدمات أخرى
```

### 2. إنشاء خدمة جديدة
```typescript
// ✅ الطريقة الصحيحة
import { createBaseService } from '@/lib/services/base.service';

export const clientservice = createBaseService('clients');

// ❌ ممنوع: لا تستخدم Axios مباشرة في المكونات أو الـ Hooks
import axios from 'axios';
```

## القواعد الإلزامية

### 1. استخدام الخدمة الأساسية
- يجب إنشاء خدمة لكل مورد (resource) باستخدام `createBaseService`.
- يجب أن تتم جميع طلبات API من خلال دوال الخدمة.

### 2. الدوال الأساسية CRUD
استخدم الدوال الأساسية المتوفرة:
```typescript
// ✅ صحيح
await clientservice.getAll();
await clientservice.getById(1);
await clientservice.create(data);
await clientservice.update(1, data);
await clientservice.delete(1);

// ❌ خطأ (في المكونات)
await axios.get('/api/clients');
```

### 3. العمليات المخصصة
للعمليات المخصصة، استخدم الدوال المرنة:
```typescript
// ✅ صحيح
await clientservice.customGet('/clients/active');
await clientservice.customPost('/clients/1/activate');

// ❌ خطأ (في المكونات)
await fetch('/api/clients/active');
```

### 4. التعامل مع الملفات
استخدم دوال الملفات المخصصة:
```typescript
// ✅ صحيح
await clientservice.uploadFile('/clients/1/avatar', formData);
await clientservice.downloadFile('/clients/1/report');
```

### 5. العمليات الجماعية
استخدم دوال العمليات الجماعية:
```typescript
// ✅ صحيح
await clientservice.bulkCreate(items);
await clientservice.bulkUpdate(items);
await clientservice.bulkDelete(ids);
```

## التوسيع والتخصيص

### 1. إضافة دوال مخصصة
```typescript
// ✅ صحيح
import { createBaseService } from '@/lib/services/base.service';

export const clientservice = {
    ...createBaseService('clients'),
    
    async activateUser(id: number) {
        return this.customPost(`/clients/${id}/activate`);
    }
};
```

## أمثلة على الاستخدام الصحيح

### 1. في Custom Hooks (باستخدام TanStack Query)
```typescript
// ✅ صحيح
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientservice } from '@/features/clients/clients.service';

export const useclients = () => {
    return useQuery({
        queryKey: ['clients'],
        queryFn: () => clientservice.getAll()
    });
};

export const useActivateUser = () => {
    return useMutation({
        mutationFn: (id: number) => clientservice.activateUser(id)
    });
};
```

### 2. في الخدمات المخصصة
```typescript
// ✅ صحيح
export const orderService = {
    ...createBaseService('orders'),
    
    async completeOrder(id: number) {
        return this.customPost(`/orders/${id}/complete`);
    },
    
    async generateInvoice(id: number) {
        return this.downloadFile(`/orders/${id}/invoice`);
    }
};
```

## التحقق من الامتثال

### 1. ESLint Rules
يجب إضافة قواعد ESLint لمنع استخدام `axios` أو `fetch` مباشرة خارج طبقة الخدمات:
```json
{
    "rules": {
        "no-restricted-imports": ["error", {
            "patterns": [{
                "group": ["axios", "node-fetch", "ofetch"],
                "message": "Please use a function from the api service layer instead.",
                "allowTypeImports": true
            }]
        }]
    }
}
```

### 2. Code Review
- تحقق من أن جميع الطلبات تتم عبر services.
- تأكد من عدم وجود استدعاءات HTTP مباشرة في المكونات أو الـ Hooks.
- تحقق من استخدام الدوال المناسبة للعمليات المختلفة.