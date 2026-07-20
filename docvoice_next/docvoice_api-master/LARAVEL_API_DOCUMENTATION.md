# توثيق Laravel API - ChatSphere

## جدول المحتويات

1. [نظرة عامة على المشروع](#نظرة-عامة-على-المشروع)
2. [قاعدة البيانات والعلاقات](#قاعدة-البيانات-والعلاقات)
3. [نقاط API الكاملة](#نقاط-api-الكاملة)
4. [Authentication & Authorization](#authentication--authorization)
5. [Multi-Tenancy](#multi-tenancy)
6. [File Uploads & Storage](#file-uploads--storage)
7. [WebSocket Events](#websocket-events)

---

## نظرة عامة على المشروع

### البنية المعمارية
- **نوع المشروع**: Multi-Tenant SaaS Application
- **قاعدة البيانات**: MySQL
- **نظام المصادقة**: JWT Token + Session-based (للتوافق مع Replit Auth)
- **Real-time Communication**: WebSocket (ws)

### المميزات الرئيسية
- نظام إدارة الشركات (Companies)
- نظام المستخدمين مع أدوار مختلفة (admin, company_manager, member)
- نظام القنوات (Channels) - عامة وخاصة
- نظام الرسائل (Messages) - في القنوات والرسائل المباشرة
- نظام المخططات الهندسية (Drawings) مع المراجعات (Revisions)
- نظام التذاكر (Tickets) لإدارة المشاكل
- نظام الإشعارات (Notifications)
- نظام التفاعلات (Reactions) والنجوم (Starred Messages)
- نظام الـ Mentions
- نظام Push Notifications

---

## قاعدة البيانات والعلاقات

### الجداول الرئيسية

#### 1. companies (الشركات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- name: VARCHAR(255) NOT NULL
- domain: VARCHAR(255) NULLABLE
- invitation_code: VARCHAR(50) NULLABLE (UNIQUE INDEX)
- plan_type: VARCHAR(50) DEFAULT 'basic' NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- One-to-Many: users, channels, messages, drawings, tickets, projects, disciplines, floors

**Indexes:**
- `idx_companies_domain` على `domain`
- `idx_companies_invitation_code` على `invitation_code`

---

#### 2. users (المستخدمين)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- email: VARCHAR(255) NOT NULL
- name: VARCHAR(255) NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- profile_image_url: TEXT NULLABLE
- status: VARCHAR(50) NULLABLE
- is_online: BOOLEAN DEFAULT FALSE
- last_seen: TIMESTAMP NULLABLE
- role: VARCHAR(20) DEFAULT 'member' NOT NULL (admin, company_manager, member)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id)
- One-to-Many: channels (created_by), messages (user_id), drawings (created_by), tickets (created_by, assigned_to, reporter), attachments (created_by)

**Indexes:**
- `idx_users_email_company` UNIQUE على `(email, company_id)`
- `idx_users_company` على `company_id`

---

#### 3. channels (القنوات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(100) NOT NULL
- description: TEXT NULLABLE
- is_private: BOOLEAN DEFAULT FALSE NOT NULL
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), createdBy (created_by -> users.id)
- One-to-Many: messages (channel_id), channelMembers (channel_id)

**Indexes:**
- `idx_channels_company` على `company_id`

---

#### 4. messages (الرسائل)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- content: TEXT NOT NULL
- channel_id: INT NULLABLE (FK -> channels.id)
- user_id: INT NOT NULL (FK -> users.id)
- reply_to_id: INT NULLABLE (FK -> messages.id)
- attachment_url: TEXT NULLABLE
- attachment_type: VARCHAR(100) NULLABLE
- attachment_name: VARCHAR(255) NULLABLE
- thread_parent_id: INT NULLABLE (FK -> messages.id)
- mentions: JSON DEFAULT []
- edited_at: TIMESTAMP NULLABLE
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), channel (channel_id -> channels.id), user (user_id -> users.id), replyTo (reply_to_id -> messages.id)
- One-to-Many: attachments (message_id), messageMentions (message_id), reactions (message_id), starredMessages (message_id)

**Indexes:**
- `idx_messages_company` على `company_id`

---

#### 5. direct_messages (الرسائل المباشرة)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- content: TEXT NOT NULL
- from_user_id: INT NOT NULL (FK -> users.id)
- to_user_id: INT NOT NULL (FK -> users.id)
- reply_to_id: INT NULLABLE (FK -> direct_messages.id)
- attachment_url: TEXT NULLABLE
- attachment_type: VARCHAR(100) NULLABLE
- attachment_name: VARCHAR(255) NULLABLE
- is_read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), fromUser (from_user_id -> users.id), toUser (to_user_id -> users.id)

**Indexes:**
- `idx_direct_messages_company` على `company_id`

---

#### 6. channel_members (أعضاء القنوات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- channel_id: INT NOT NULL (FK -> channels.id)
- user_id: INT NOT NULL (FK -> users.id)
- joined_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: channel (channel_id -> channels.id), user (user_id -> users.id)

---

#### 7. reactions (التفاعلات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- message_id: INT NOT NULL (FK -> messages.id)
- user_id: INT NOT NULL (FK -> users.id)
- icon: VARCHAR(10) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), message (message_id -> messages.id), user (user_id -> users.id)

**Indexes:**
- `idx_reactions_company` على `company_id`

---

#### 8. notifications (الإشعارات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- user_id: INT NOT NULL (FK -> users.id)
- type: VARCHAR(50) NOT NULL (mention, direct_message, channel_message, channel_added)
- message_id: INT NULLABLE (FK -> messages.id)
- channel_id: INT NULLABLE (FK -> channels.id)
- direct_message_id: INT NULLABLE (FK -> direct_messages.id)
- from_user_id: INT NULLABLE (FK -> users.id)
- content: TEXT NOT NULL
- is_read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), user (user_id -> users.id), fromUser (from_user_id -> users.id)

**Indexes:**
- `idx_notifications_company` على `company_id`

---

#### 9. starred_messages (الرسائل المميزة)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- message_id: INT NOT NULL (FK -> messages.id)
- user_id: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: message (message_id -> messages.id), user (user_id -> users.id)

**Indexes:**
- `unique_message_user` UNIQUE على `(message_id, user_id)`

---

#### 10. message_mentions (الإشارات في الرسائل)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- message_id: INT NOT NULL (FK -> messages.id) ON DELETE CASCADE
- user_id: INT NOT NULL (FK -> users.id) ON DELETE CASCADE
- company_id: INT NOT NULL (FK -> companies.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: message (message_id -> messages.id), user (user_id -> users.id), company (company_id -> companies.id)

**Indexes:**
- `idx_message_mentions_message` على `message_id`
- `idx_message_mentions_user` على `user_id`
- `idx_message_mentions_company` على `company_id`

---

#### 11. attachments (المرفقات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- filename: VARCHAR(255) NOT NULL
- original_name: VARCHAR(255) NOT NULL
- mime_type: VARCHAR(100) NOT NULL
- size: VARCHAR(20) NOT NULL
- url: TEXT NOT NULL
- message_id: INT NULLABLE (FK -> messages.id)
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), message (message_id -> messages.id), createdBy (created_by -> users.id)

**Indexes:**
- `idx_attachments_company` على `company_id`

---

#### 12. drawings (المخططات الهندسية)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(255) NOT NULL
- description: TEXT NULLABLE
- data: JSON NOT NULL
- discipline_id: INT NULLABLE (FK -> disciplines.id)
- floor_id: INT NULLABLE (FK -> floors.id)
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), createdBy (created_by -> users.id)
- One-to-Many: drawingRevisions (drawing_id), drawingAnnotations (drawing_id), drawingComments (drawing_id), layers (drawing_id), pins (drawing_id), tickets (drawing_id)

**Indexes:**
- `idx_drawings_company` على `company_id`

---

#### 13. drawing_revisions (مراجعات المخططات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- drawing_id: INT NOT NULL (FK -> drawings.id)
- version: VARCHAR(20) NOT NULL
- changes: JSON NOT NULL
- status: VARCHAR(50) DEFAULT 'draft' NOT NULL (draft, approved, rejected)
- file_url: TEXT NULLABLE
- thumbnail_url: TEXT NULLABLE
- file_name: VARCHAR(255) NULLABLE
- file_type: VARCHAR(100) NULLABLE
- file_size: VARCHAR(20) NULLABLE
- ai_extracted_data: JSON NULLABLE
- uploaded_by: INT NULLABLE (FK -> users.id)
- reviewed_by: INT NULLABLE (FK -> users.id)
- review_notes: TEXT NULLABLE
- uploaded_at: TIMESTAMP DEFAULT NOW()
- reviewed_at: TIMESTAMP NULLABLE
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), uploadedBy (uploaded_by -> users.id), reviewedBy (reviewed_by -> users.id), createdBy (created_by -> users.id)
- One-to-Many: drawingPages (revision_id)

---

#### 14. drawing_pages (صفحات المخططات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- revision_id: INT NOT NULL (FK -> drawing_revisions.id)
- page_number: VARCHAR(10) NOT NULL
- image_url: TEXT NOT NULL
- thumbnail_url: TEXT NULLABLE
- extracted_text: TEXT NULLABLE
- extracted_metadata: JSON NULLABLE
- ai_extracted_data: JSON NULLABLE
- width: VARCHAR(20) NULLABLE
- height: VARCHAR(20) NULLABLE
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: revision (revision_id -> drawing_revisions.id)

---

#### 15. disciplines (التخصصات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(100) NOT NULL
- description: TEXT NULLABLE
- code: VARCHAR(20) NULLABLE
- color: VARCHAR(20) NULLABLE
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id)
- One-to-Many: drawings (discipline_id), tickets (discipline_id)

**Indexes:**
- `idx_disciplines_company` على `company_id`

---

#### 16. floors (الطوابق)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(100) NOT NULL
- level: VARCHAR(20) NOT NULL
- description: TEXT NULLABLE
- project_id: INT NULLABLE (FK -> projects.id)
- sort_order: VARCHAR(10) DEFAULT '0'
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), project (project_id -> projects.id)
- One-to-Many: drawings (floor_id), rooms (floor_id)

**Indexes:**
- `idx_floors_company` على `company_id`

---

#### 17. projects (المشاريع)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(255) NOT NULL
- description: TEXT NULLABLE
- status: VARCHAR(50) DEFAULT 'active'
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), createdBy (created_by -> users.id)
- One-to-Many: floors (project_id), projectMembers (project_id)

**Indexes:**
- `idx_projects_company` على `company_id`

---

#### 18. project_members (أعضاء المشاريع)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- project_id: INT NOT NULL (FK -> projects.id)
- user_id: INT NOT NULL (FK -> users.id)
- role: VARCHAR(50) DEFAULT 'member'
- joined_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: project (project_id -> projects.id), user (user_id -> users.id)

---

#### 19. tickets (التذاكر)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- title: VARCHAR(255) NOT NULL
- description: TEXT NULLABLE
- type: VARCHAR(50) DEFAULT 'issue' NOT NULL (RFI, Issue, Clash, etc.)
- status: VARCHAR(50) DEFAULT 'open' NOT NULL (open, in_progress, resolved, closed)
- priority: VARCHAR(50) DEFAULT 'medium' NOT NULL (low, medium, high, urgent)
- drawing_id: INT NULLABLE (FK -> drawings.id)
- discipline_id: INT NULLABLE (FK -> disciplines.id)
- pin_id: INT NULLABLE (FK -> pins.id)
- layer_id: INT NULLABLE (FK -> layers.id)
- assigned_to: INT NULLABLE (FK -> users.id)
- created_by: INT NOT NULL (FK -> users.id)
- reporter: INT NULLABLE (FK -> users.id)
- channel_id: INT NULLABLE (FK -> channels.id)
- sla_hours: VARCHAR(10) NULLABLE
- due_date: TIMESTAMP NULLABLE
- tags: JSON DEFAULT []
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), drawing (drawing_id -> drawings.id), discipline (discipline_id -> disciplines.id), pin (pin_id -> pins.id), layer (layer_id -> layers.id), assignedTo (assigned_to -> users.id), createdBy (created_by -> users.id), reporter (reporter -> users.id), channel (channel_id -> channels.id)

**Indexes:**
- `idx_tickets_company` على `company_id`

---

#### 20. pins (الدبابيس)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- name: VARCHAR(100) NOT NULL
- x: VARCHAR(20) NOT NULL
- y: VARCHAR(20) NOT NULL
- type: VARCHAR(50) NOT NULL
- data: JSON NULLABLE
- drawing_id: INT NOT NULL (FK -> drawings.id)
- layer_id: INT NULLABLE (FK -> layers.id)
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), layer (layer_id -> layers.id), createdBy (created_by -> users.id)
- One-to-Many: tickets (pin_id), drawingPins (pin_id)

---

#### 21. layers (الطبقات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- name: VARCHAR(100) NOT NULL
- type: VARCHAR(50) NOT NULL
- data: JSON NOT NULL
- drawing_id: INT NOT NULL (FK -> drawings.id)
- visible: BOOLEAN DEFAULT TRUE
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), createdBy (created_by -> users.id)
- One-to-Many: pins (layer_id), tickets (layer_id)

---

#### 22. drawing_annotations (التعليقات على المخططات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- drawing_id: INT NOT NULL (FK -> drawings.id)
- page_id: INT NULLABLE (FK -> drawing_pages.id)
- type: VARCHAR(50) NOT NULL
- data: JSON NOT NULL
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), page (page_id -> drawing_pages.id), createdBy (created_by -> users.id)

---

#### 23. drawing_comments (تعليقات المخططات)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- drawing_id: INT NOT NULL (FK -> drawings.id)
- content: TEXT NOT NULL
- x: VARCHAR(20) NULLABLE
- y: VARCHAR(20) NULLABLE
- created_by: INT NOT NULL (FK -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), createdBy (created_by -> users.id)

---

#### 24. rooms (الغرف)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- name: VARCHAR(100) NOT NULL
- floor_id: INT NOT NULL (FK -> floors.id)
- area: VARCHAR(20) NULLABLE
- description: TEXT NULLABLE
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: floor (floor_id -> floors.id)

---

#### 25. drawing_layers (طبقات المخططات - جدول الربط)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- drawing_id: INT NOT NULL (FK -> drawings.id)
- layer_id: INT NOT NULL (FK -> layers.id)
- order: VARCHAR(10) NOT NULL
- visible: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), layer (layer_id -> layers.id)

---

#### 26. drawing_pins (دبابيس المخططات - جدول الربط)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- drawing_id: INT NOT NULL (FK -> drawings.id)
- pin_id: INT NOT NULL (FK -> pins.id)
- x: VARCHAR(20) NOT NULL
- y: VARCHAR(20) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
```

**العلاقات:**
- Many-to-One: drawing (drawing_id -> drawings.id), pin (pin_id -> pins.id)

---

#### 27. saved_views (العروض المحفوظة)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- company_id: INT NOT NULL (FK -> companies.id)
- name: VARCHAR(100) NOT NULL
- type: VARCHAR(50) NOT NULL
- data: JSON NOT NULL
- user_id: INT NOT NULL (FK -> users.id)
- is_shared: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: company (company_id -> companies.id), user (user_id -> users.id)

**Indexes:**
- `idx_saved_views_company` على `company_id`

---

#### 28. push_subscriptions (اشتراكات Push Notifications)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL (FK -> users.id) ON DELETE CASCADE
- endpoint: TEXT NOT NULL
- keys: JSON NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
```

**العلاقات:**
- Many-to-One: user (user_id -> users.id)

**Indexes:**
- `idx_push_subscriptions_user` على `user_id`
- `idx_push_subscriptions_endpoint` UNIQUE على `endpoint`

---

#### 29. sessions (الجلسات)
```sql
- sid: VARCHAR(191) PRIMARY KEY
- sess: JSON NOT NULL
- expire: TIMESTAMP NOT NULL
```

**Indexes:**
- `IDX_session_expire` على `expire`

---

## نقاط API الكاملة

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
**الوصف**: تسجيل مستخدم جديد

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "companyId": 1,  // Optional - يمكن أن يأتي من tenantResolver
  "role": "member"  // Optional - 'member' أو 'company_manager'
}
```

**Response** (201):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "companyId": 1,
  "token": "jwt_token_here"
}
```

**Status Codes**:
- 201: تم التسجيل بنجاح
- 400: بيانات غير صحيحة
- 409: البريد الإلكتروني مستخدم بالفعل
- 503: قاعدة البيانات غير متاحة

---

#### POST `/api/auth/login`
**الوصف**: تسجيل الدخول

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "companyId": 1,
  "token": "jwt_token_here"
}
```

**Status Codes**:
- 200: تم تسجيل الدخول بنجاح
- 400: بيانات غير صحيحة
- 401: بريد إلكتروني أو كلمة مرور خاطئة
- 503: قاعدة البيانات غير متاحة

---

#### POST `/api/auth/logout`
**الوصف**: تسجيل الخروج

**Authentication**: مطلوب (Session)

**Response** (204): No Content

---

#### GET `/api/auth/me` أو `/api/auth/user`
**الوصف**: الحصول على بيانات المستخدم الحالي

**Authentication**: مطلوب (JWT أو Session)

**Response** (200):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "companyId": 1,
  "role": "member"
}
```

**Status Codes**:
- 200: نجح
- 401: غير مصرح

---

### Company Routes (`/api/companies`)

#### POST `/api/companies`
**الوصف**: إنشاء شركة جديدة مع مستخدم مسؤول

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "name": "Company Name",
  "domain": "company.com",  // Optional
  "planType": "basic",  // Optional, default: "basic"
  "invitationCode": "CODE123",  // Optional
  "adminEmail": "admin@company.com",
  "adminPassword": "password123",
  "adminName": "Admin Name"
}
```

**Response** (201):
```json
{
  "company": {
    "id": 1,
    "name": "Company Name",
    "domain": "company.com",
    "planType": "basic"
  },
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "name": "Admin Name",
    "companyId": 1
  },
  "token": "jwt_token_here"
}
```

**Status Codes**:
- 201: تم الإنشاء بنجاح
- 400: بيانات غير صحيحة
- 409: اسم الشركة موجود بالفعل
- 500: فشل الإنشاء

---

#### GET `/api/companies/:id`
**الوصف**: الحصول على بيانات شركة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "name": "Company Name",
  "domain": "company.com",
  "planType": "basic"
}
```

**Status Codes**:
- 200: نجح
- 400: معرف الشركة غير صحيح
- 403: غير مصرح
- 404: الشركة غير موجودة

---

#### POST `/api/companies/find`
**الوصف**: البحث عن شركة برمز الدعوة أو الاسم

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "invitationCode": "CODE123"  // أو
  // "companyName": "Company Name"
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Company Name",
  "domain": "company.com",
  "planType": "basic"
}
```

**Status Codes**:
- 200: نجح
- 400: يجب توفير invitationCode أو companyName
- 404: الشركة غير موجودة

---

#### POST `/api/companies/create-simple`
**الوصف**: إنشاء شركة بسيطة (الاسم فقط)

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "name": "Company Name"
}
```

**Response** (201):
```json
{
  "id": 1,
  "name": "Company Name"
}
```

---

#### POST `/api/verify-access-code`
**الوصف**: التحقق من رمز الوصول

**Authentication**: غير مطلوب

**Request Body**:
```json
{
  "code": "ACCESS_CODE"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### User Routes (`/api/users`)

#### GET `/api/users`
**الوصف**: الحصول على قائمة جميع المستخدمين في الشركة

**Authentication**: مطلوب

**Query Parameters**: لا يوجد

**Response** (200):
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "companyId": 1,
    "role": "member",
    "isOnline": true,
    "profileImageUrl": null
  }
]
```

---

#### GET `/api/users/:id`
**الوصف**: الحصول على بيانات مستخدم محدد

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "companyId": 1,
  "role": "member"
}
```

**Status Codes**:
- 200: نجح
- 404: المستخدم غير موجود

---

#### PATCH `/api/users/:id/role`
**الوصف**: تحديث دور المستخدم (Admin فقط)

**Authentication**: مطلوب + Admin Role

**Request Body**:
```json
{
  "role": "admin"  // أو "member"
}
```

**Response** (200):
```json
{
  "id": 1,
  "role": "admin"
}
```

**Status Codes**:
- 200: نجح
- 400: دور غير صحيح
- 403: غير مصرح (يجب أن تكون admin)

---

#### DELETE `/api/users/:id`
**الوصف**: حذف مستخدم (Admin فقط)

**Authentication**: مطلوب + Admin Role

**Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

**Status Codes**:
- 200: نجح
- 400: لا يمكن حذف حسابك الخاص
- 403: غير مصرح (يجب أن تكون admin)

---

### Channel Routes (`/api/channels`)

#### GET `/api/channels`
**الوصف**: الحصول على قائمة القنوات

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "general",
    "description": "General channel",
    "isPrivate": false,
    "companyId": 1,
    "createdBy": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**ملاحظات**:
- Company Manager: يحصل على جميع قنوات الشركة
- Member: يحصل فقط على القنوات التي هو عضو فيها

---

#### GET `/api/channels/:id`
**الوصف**: الحصول على بيانات قناة محددة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "name": "general",
  "description": "General channel",
  "isPrivate": false,
  "companyId": 1,
  "createdBy": 1
}
```

**Status Codes**:
- 200: نجح
- 403: غير مصرح (قناة خاصة وأنت لست عضو)
- 404: القناة غير موجودة

---

#### POST `/api/channels`
**الوصف**: إنشاء قناة جديدة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "name": "channel-name",
  "description": "Channel description",  // Optional
  "isPrivate": false,  // Optional, default: false
  "companyId": 1
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "channel-name",
  "description": "Channel description",
  "isPrivate": false,
  "companyId": 1,
  "createdBy": 1
}
```

**ملاحظات**:
- المنشئ يتم إضافته تلقائياً كعضو في القناة
- القنوات العامة يتم بثها لجميع العملاء
- القنوات الخاصة يتم بثها فقط للمنشئ

---

#### PUT `/api/channels/:id`
**الوصف**: تحديث قناة (Company Manager فقط)

**Authentication**: مطلوب + Company Manager Role

**Request Body**:
```json
{
  "name": "updated-name",  // Optional
  "description": "Updated description",  // Optional
  "isPrivate": true  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "updated-name",
  "description": "Updated description",
  "isPrivate": true
}
```

---

#### POST `/api/channels/:id/join`
**الوصف**: الانضمام إلى قناة عامة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Joined channel successfully"
}
```

**Status Codes**:
- 200: نجح
- 400: أنت عضو بالفعل
- 403: لا يمكن الانضمام إلى قناة خاصة
- 404: القناة غير موجودة

---

#### GET `/api/channels/:id/members`
**الوصف**: الحصول على أعضاء القناة

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com"
    }
  }
]
```

**ملاحظات**:
- القنوات الخاصة: يعرض فقط الأعضاء
- القنوات العامة: يعرض جميع مستخدمي الشركة

---

#### POST `/api/channels/:id/members`
**الوصف**: إضافة عضو إلى قناة (Company Manager فقط)

**Authentication**: مطلوب + Company Manager Role

**Request Body**:
```json
{
  "userId": 2
}
```

**Response** (201):
```json
{
  "message": "Member added successfully"
}
```

**ملاحظات**:
- يتم إنشاء إشعار للمستخدم المضاف
- يتم إرسال إشعار push
- يتم بث إشعار real-time

---

#### DELETE `/api/channels/:id/members/:userId`
**الوصف**: إزالة عضو من قناة (Company Manager فقط)

**Authentication**: مطلوب + Company Manager Role

**Response** (200):
```json
{
  "message": "Member removed successfully"
}
```

---

#### PATCH `/api/channels/:id/mark-read`
**الوصف**: تحديد إشعارات القناة كمقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Channel notifications marked as read"
}
```

---

#### GET `/api/channels/:id/messages`
**الوصف**: الحصول على رسائل القناة

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "content": "Message content",
    "channelId": 1,
    "userId": 1,
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Status Codes**:
- 200: نجح
- 403: غير مصرح (قناة خاصة وأنت لست عضو)
- 404: القناة غير موجودة

---

### Message Routes (`/api/messages`)

#### POST `/api/messages`
**الوصف**: إنشاء رسالة جديدة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "content": "Message content",
  "channelId": 1,
  "replyToId": null,  // Optional
  "threadParentId": null,  // Optional
  "attachmentUrl": null,  // Optional
  "attachmentType": null,  // Optional
  "attachmentName": null,  // Optional
  "mentionedUserIds": [2, 3]  // Optional - array of user IDs
}
```

**Response** (200):
```json
{
  "id": 1,
  "content": "Message content",
  "channelId": 1,
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**ملاحظات**:
- يتم التحقق من أن المستخدم عضو في القناة
- يتم إنشاء إشعارات للمستخدمين المذكورين
- يتم إنشاء إشعارات لجميع أعضاء القناة (عدا المرسل والمذكورين)
- يتم بث الرسالة عبر WebSocket

**Status Codes**:
- 200: نجح
- 400: بيانات غير صحيحة أو channelId مطلوب
- 403: غير مصرح (لست عضو في القناة)
- 404: القناة غير موجودة

---

#### PATCH `/api/messages/:id`
**الوصف**: تعديل رسالة (المرسل فقط)

**Authentication**: مطلوب

**Request Body**:
```json
{
  "content": "Updated content",
  "mentionedUserIds": [2, 3]  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "content": "Updated content",
  "editedAt": "2024-01-01T00:00:00Z"
}
```

**ملاحظات**:
- يتم بث التحديث عبر WebSocket

**Status Codes**:
- 200: نجح
- 403: يمكنك تعديل رسائلك فقط
- 404: الرسالة غير موجودة

---

#### DELETE `/api/messages/:id`
**الوصف**: حذف رسالة (المرسل فقط)

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Message deleted"
}
```

**ملاحظات**:
- يتم بث الحذف عبر WebSocket

**Status Codes**:
- 200: نجح
- 403: يمكنك حذف رسائلك فقط
- 404: الرسالة غير موجودة

---

#### GET `/api/messages`
**الوصف**: الحصول على جميع رسائل المستخدم

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "content": "Message content",
    "channelId": 1,
    "userId": 1
  }
]
```

---

#### GET `/api/messages/threads`
**الوصف**: الحصول على جميع المواضيع (الرسائل التي لها ردود)

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "content": "Thread parent",
    "channelId": 1,
    "userId": 1,
    "user": {...},
    "channel": {...},
    "replyCount": 5
  }
]
```

---

#### GET `/api/messages/threads/count`
**الوصف**: الحصول على عدد المواضيع

**Authentication**: مطلوب

**Response** (200):
```json
{
  "count": 10
}
```

---

#### GET `/api/messages/:id/mentions`
**الوصف**: الحصول على المستخدمين المذكورين في رسالة

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "messageId": 1,
    "userId": 2,
    "user": {
      "id": 2,
      "name": "Mentioned User"
    }
  }
]
```

---

### Direct Messages Routes (`/api/direct-messages`)

#### GET `/api/direct-messages/:userId`
**الوصف**: الحصول على الرسائل المباشرة مع مستخدم محدد

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "content": "Direct message",
    "fromUserId": 1,
    "toUserId": 2,
    "sender": {
      "id": 1,
      "name": "Sender Name"
    },
    "recipient": {
      "id": 2,
      "name": "Recipient Name"
    },
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST `/api/direct-messages`
**الوصف**: إرسال رسالة مباشرة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "content": "Direct message content",
  "toUserId": 2,
  "replyToId": null,  // Optional
  "attachmentUrl": null,  // Optional
  "attachmentType": null,  // Optional
  "attachmentName": null  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "content": "Direct message content",
  "fromUserId": 1,
  "toUserId": 2,
  "sender": {...},
  "recipient": {...},
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**ملاحظات**:
- يتم إنشاء إشعار للمستقبل
- يتم إرسال إشعار push
- يتم بث الرسالة عبر WebSocket للمرسل والمستقبل

---

#### GET `/api/direct-messages/unread-counts`
**الوصف**: الحصول على عدد الرسائل غير المقروءة لكل مستخدم

**Authentication**: مطلوب

**Response** (200):
```json
{
  "2": 5,  // 5 رسائل غير مقروءة من المستخدم 2
  "3": 2   // 2 رسالة غير مقروءة من المستخدم 3
}
```

---

#### GET `/api/direct-messages/total-unread-count`
**الوصف**: الحصول على إجمالي عدد الرسائل غير المقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "count": 7
}
```

---

#### PATCH `/api/direct-messages/:userId/mark-read`
**الوصف**: تحديد الرسائل المباشرة من مستخدم كمقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Direct messages marked as read"
}
```

---

### Reaction Routes (`/api/reactions`)

#### POST `/api/reactions`
**الوصف**: إضافة تفاعل على رسالة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "messageId": 1,
  "icon": "👍"
}
```

**Response** (200):
```json
{
  "id": 1,
  "messageId": 1,
  "userId": 1,
  "icon": "👍",
  "user": {
    "id": 1,
    "name": "User Name"
  }
}
```

**ملاحظات**:
- يتم بث التفاعل عبر WebSocket
- إذا كان التفاعل موجود بالفعل، يتم إرجاع 200 (idempotent)

---

#### DELETE `/api/reactions/:messageId/:icon`
**الوصف**: إزالة تفاعل من رسالة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Reaction removed"
}
```

**ملاحظات**:
- يتم بث الإزالة عبر WebSocket

---

#### GET `/api/messages/:messageId/reactions`
**الوصف**: الحصول على جميع التفاعلات على رسالة

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "messageId": 1,
    "userId": 1,
    "icon": "👍",
    "user": {
      "id": 1,
      "name": "User Name"
    }
  }
]
```

---

### Starred Messages Routes (`/api/messages/:id/star`)

#### POST `/api/messages/:id/star`
**الوصف**: إضافة/إزالة نجمة من رسالة (Toggle)

**Authentication**: مطلوب

**Response** (200):
```json
{
  "isStarred": true,
  "message": "Message starred"  // أو "Message unstarred"
}
```

---

#### DELETE `/api/messages/:id/star`
**الوصف**: إزالة نجمة من رسالة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Message unstarred"
}
```

---

#### GET `/api/messages/:id/starred`
**الوصف**: التحقق من حالة النجمة على رسالة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "isStarred": true
}
```

---

#### GET `/api/starred`
**الوصف**: الحصول على جميع الرسائل المميزة للمستخدم

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "messageId": 1,
    "userId": 1,
    "message": {
      "id": 1,
      "content": "Starred message"
    }
  }
]
```

---

#### GET `/api/starred/count`
**الوصف**: الحصول على عدد الرسائل المميزة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "count": 5
}
```

---

### Mentions Routes (`/api/mentions`)

#### GET `/api/mentions`
**الوصف**: الحصول على جميع الرسائل التي تم فيها ذكر المستخدم الحالي

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "messageId": 1,
    "userId": 1,
    "message": {
      "id": 1,
      "content": "Hello @user",
      "channelId": 1
    }
  }
]
```

---

#### GET `/api/mentions/count`
**الوصف**: الحصول على عدد الإشارات غير المقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "count": 3
}
```

---

### Notification Routes (`/api/notifications`)

#### GET `/api/notifications`
**الوصف**: الحصول على جميع إشعارات المستخدم

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "type": "mention",
    "content": "You were mentioned",
    "fromUser": {
      "id": 2,
      "name": "User Name"
    },
    "channel": {
      "id": 1,
      "name": "general"
    },
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET `/api/notifications/unread-count`
**الوصف**: الحصول على عدد الإشعارات غير المقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "count": 5
}
```

---

#### PATCH `/api/notifications/:id/read`
**الوصف**: تحديد إشعار كمقروء

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "Notification marked as read"
}
```

---

#### PATCH `/api/notifications/mark-all-read`
**الوصف**: تحديد جميع الإشعارات كمقروءة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "message": "All notifications marked as read"
}
```

---

### Drawing Routes (`/api/drawings`)

#### GET `/api/drawings`
**الوصف**: الحصول على قائمة المخططات (مع pagination)

**Authentication**: مطلوب

**Query Parameters**:
- `page`: رقم الصفحة (default: 1)
- `limit`: عدد النتائج (default: 30)

**Response** (200):
```json
{
  "drawings": [
    {
      "id": 1,
      "name": "Drawing Name",
      "description": "Description",
      "data": {...},
      "disciplineId": 1,
      "floorId": 1,
      "createdBy": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 30
}
```

---

#### GET `/api/drawings/:id`
**الوصف**: الحصول على مخطط محدد

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "name": "Drawing Name",
  "description": "Description",
  "data": {...},
  "disciplineId": 1,
  "floorId": 1,
  "createdBy": 1
}
```

---

#### POST `/api/drawings`
**الوصف**: إنشاء مخطط جديد

**Authentication**: مطلوب

**Request Body**:
```json
{
  "title": "Drawing Title",
  "sheetNo": "A-101",
  "description": "Description",  // Optional
  "disciplineId": 1,  // Optional
  "floorId": 1,  // Optional
  "data": {
    "sheetNo": "A-101",
    "title": "Drawing Title"
  }
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Drawing Title",
  "data": {
    "sheetNo": "A-101"
  }
}
```

**Status Codes**:
- 200: نجح
- 400: sheetNo مطلوب
- 409: مخطط بهذا الرقم موجود بالفعل

---

#### GET `/api/drawings/:id/revisions`
**الوصف**: الحصول على جميع مراجعات مخطط

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "drawingId": 1,
    "version": "R1_abc123",
    "status": "draft",
    "fileUrl": "/uploads/drawings/file.pdf",
    "fileName": "file.pdf",
    "fileType": "application/pdf",
    "uploadedBy": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST `/api/drawings/:id/revisions`
**الوصف**: إنشاء مراجعة جديدة لمخطط

**Authentication**: مطلوب

**Request Body**:
```json
{
  "version": "R1_abc123",  // Optional - يتم توليده تلقائياً
  "changes": {},  // Optional
  "status": "draft",  // Optional
  "fileUrl": "/uploads/drawings/file.pdf",  // Optional
  "fileName": "file.pdf",  // Optional
  "fileType": "application/pdf"  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "drawingId": 1,
  "version": "R1_abc123",
  "status": "draft"
}
```

---

#### POST `/api/drawings/:id/upload`
**الوصف**: رفع ملف مخطط (PDF أو صورة)

**Authentication**: مطلوب

**Request**: `multipart/form-data`
- `file`: الملف (PDF, PNG, JPG)
- `revisionNo`: رقم المراجعة (Optional - يتم توليده تلقائياً)

**Response** (200):
```json
{
  "drawingId": 1,
  "revisionId": 1,
  "pageCount": 1,
  "extractedText": {
    "fullText": "",
    "metadata": {
      "sheetNumbers": [],
      "roomNames": [],
      "dimensions": []
    }
  },
  "aiAnalysis": null
}
```

---

#### POST `/api/drawings/upload-manual`
**الوصف**: رفع مخطط يدوياً (PDF فقط)

**Authentication**: مطلوب

**Request**: `multipart/form-data`
- `file`: ملف PDF
- `sheetNo`: رقم المخطط (مطلوب)
- `title`: عنوان المخطط (مطلوب)
- `disciplineId`: معرف التخصص (مطلوب)
- `floorId`: معرف الطابق (Optional)
- `versionType`: نوع الإصدار - "new" أو "update" (مطلوب)
- `parentDrawingId`: معرف المخطط الأصلي (مطلوب إذا versionType = "update")
- `revisionNotes`: ملاحظات المراجعة (Optional)

**Response** (200):
```json
{
  "drawingId": 1,
  "revisionId": 1,
  "pageCount": 5,
  "uploadMethod": "manual",
  "extractedText": null,
  "aiAnalysis": null
}
```

---

#### POST `/api/drawings/annotations/save`
**الوصف**: حفظ التعليقات على مخطط ودمجها مع PDF

**Authentication**: مطلوب

**Request**: `multipart/form-data`
- `annotations`: ملفات PNG للتعليقات (multiple files)
- `revisionId`: معرف المراجعة (مطلوب)
- `drawingId`: معرف المخطط (مطلوب)

**Response** (200):
```json
{
  "success": true,
  "revision": {
    "id": 2,
    "version": "R2_xyz789"
  },
  "fileUrl": "/uploads/drawings/annotated_file.pdf"
}
```

---

#### PATCH `/api/revisions/:id/status`
**الوصف**: تحديث حالة مراجعة (approved/rejected)

**Authentication**: مطلوب

**Request Body**:
```json
{
  "status": "approved",  // أو "rejected"
  "reviewNotes": "Review notes"  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "status": "approved",
  "reviewedBy": 1,
  "reviewNotes": "Review notes",
  "reviewedAt": "2024-01-01T00:00:00Z"
}
```

---

#### GET `/api/revisions/:id/pages`
**الوصف**: الحصول على صفحات مراجعة

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "revisionId": 1,
    "pageNumber": "1",
    "imageUrl": "/uploads/pages/page1.png",
    "thumbnailUrl": "/uploads/pages/page1_thumb.png"
  }
]
```

---

#### GET `/api/pages/:id`
**الوصف**: الحصول على صفحة محددة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "revisionId": 1,
  "pageNumber": "1",
  "imageUrl": "/uploads/pages/page1.png"
}
```

---

### Layer Routes (`/api/layers`)

#### GET `/api/drawings/:id/layers`
**الوصف**: الحصول على طبقات مخطط

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Layer 1",
    "type": "annotation",
    "data": {...},
    "drawingId": 1,
    "visible": true,
    "createdBy": 1
  }
]
```

---

#### POST `/api/layers`
**الوصف**: إنشاء طبقة جديدة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "name": "Layer 1",
  "type": "annotation",
  "data": {...},
  "drawingId": 1,
  "visible": true
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Layer 1",
  "type": "annotation",
  "drawingId": 1,
  "visible": true
}
```

---

#### PATCH `/api/layers/:id/visibility`
**الوصف**: تحديث حالة إظهار/إخفاء طبقة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "visible": false
}
```

**Response** (200):
```json
{
  "id": 1,
  "visible": false
}
```

---

#### DELETE `/api/layers/:id`
**الوصف**: حذف طبقة

**Authentication**: مطلوب

**Response** (204): No Content

---

### Pin Routes (`/api/pins`)

#### GET `/api/drawings/:id/pins`
**الوصف**: الحصول على دبابيس مخطط

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Pin 1",
    "x": "100",
    "y": "200",
    "type": "pin",
    "drawingId": 1,
    "layerId": null,
    "createdBy": 1
  }
]
```

---

#### POST `/api/pins`
**الوصف**: إنشاء دبوس جديد

**Authentication**: مطلوب

**Request Body**:
```json
{
  "name": "Pin 1",  // أو "label"
  "x": 100,
  "y": 200,
  "type": "pin",
  "data": {...},  // Optional
  "drawingId": 1,
  "layerId": null  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Pin 1",
  "x": "100",
  "y": "200",
  "type": "pin",
  "drawingId": 1
}
```

---

#### DELETE `/api/pins/:id`
**الوصف**: حذف دبوس

**Authentication**: مطلوب

**Response** (204): No Content

---

#### GET `/api/pins/:id/timeline`
**الوصف**: الحصول على الجدول الزمني لدبوس (جميع التذاكر المرتبطة)

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "type": "ticket_created",
    "title": "Ticket created",
    "timestamp": "2024-01-01T00:00:00Z",
    "user": {
      "name": "User Name"
    },
    "ticketId": 1
  }
]
```

---

### Ticket Routes (`/api/tickets`)

#### GET `/api/tickets`
**الوصف**: الحصول على قائمة التذاكر (مع فلاتر متقدمة)

**Authentication**: غير مطلوب (للتوافق مع UI)

**Query Parameters**:
- `search`: نص البحث
- `type`: نوع التذكرة (array) - RFI, Issue, Clash, etc.
- `status`: الحالة (array) - open, in_progress, resolved, closed
- `priority`: الأولوية (array) - low, medium, high, urgent
- `assignedTo`: المستخدم المكلف (array)
- `drawingId`: معرف المخطط (array)
- `disciplineId`: معرف التخصص (array)
- `layerId`: معرف الطبقة (array)
- `slaStatus`: حالة SLA - overdue, due_soon, on_track
- `tags`: العلامات (array)
- `dateFrom`: تاريخ البداية
- `dateTo`: تاريخ النهاية
- `page`: رقم الصفحة
- `limit`: عدد النتائج
- `sortBy`: حقل الترتيب
- `sortOrder`: اتجاه الترتيب - asc, desc

**Response** (200):
```json
{
  "tickets": [
    {
      "id": 1,
      "title": "Ticket Title",
      "description": "Description",
      "type": "issue",
      "status": "open",
      "priority": "medium",
      "drawingId": 1,
      "assignedTo": 1,
      "createdBy": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

#### GET `/api/tickets/:id`
**الوصف**: الحصول على تذكرة محددة

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "title": "Ticket Title",
  "description": "Description",
  "type": "issue",
  "status": "open",
  "priority": "medium",
  "drawingId": 1,
  "pinId": 1,
  "layerId": 1,
  "assignedTo": 1,
  "createdBy": 1,
  "tags": ["tag1", "tag2"],
  "dueDate": "2024-01-15T00:00:00Z",
  "slaHours": "24"
}
```

---

#### POST `/api/tickets`
**الوصف**: إنشاء تذكرة جديدة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "title": "Ticket Title",
  "description": "Description",  // Optional
  "type": "issue",  // Optional, default: "issue"
  "status": "open",  // Optional, default: "open"
  "priority": "medium",  // Optional, default: "medium"
  "drawingId": 1,  // Optional
  "disciplineId": 1,  // Optional
  "pinId": 1,  // Optional
  "layerId": 1,  // Optional
  "assignedTo": 1,  // Optional
  "channelId": 1,  // Optional
  "slaHours": "24",  // Optional
  "dueDate": "2024-01-15T00:00:00Z",  // Optional
  "tags": ["tag1", "tag2"],  // Optional
  "companyId": 1
}
```

**Response** (200):
```json
{
  "id": 1,
  "title": "Ticket Title",
  "type": "issue",
  "status": "open",
  "priority": "medium",
  "createdBy": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

#### PATCH `/api/tickets/:id`
**الوصف**: تحديث تذكرة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "title": "Updated Title",  // Optional
  "description": "Updated Description",  // Optional
  "status": "in_progress",  // Optional
  "priority": "high",  // Optional
  "assignedTo": 2,  // Optional
  "tags": ["tag1", "tag3"]  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "title": "Updated Title",
  "status": "in_progress",
  "priority": "high"
}
```

---

#### PATCH `/api/tickets/:id/status`
**الوصف**: تحديث حالة تذكرة فقط

**Authentication**: مطلوب

**Request Body**:
```json
{
  "status": "resolved"
}
```

**Response** (200):
```json
{
  "id": 1,
  "status": "resolved"
}
```

---

#### DELETE `/api/tickets/:id`
**الوصف**: حذف تذكرة

**Authentication**: مطلوب

**Response** (204): No Content

---

#### PATCH `/api/tickets/bulk`
**الوصف**: تحديث جماعي لتذاكر متعددة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "ticketIds": [1, 2, 3],
  "updates": {
    "status": "resolved",
    "priority": "high",
    "assignedTo": 2,
    "tags": ["tag1", "tag2"]
  }
}
```

**Response** (200):
```json
{
  "updated": 3,
  "message": "3 ticket(s) updated successfully"
}
```

---

#### GET `/api/drawings/:id/tickets`
**الوصف**: الحصول على تذاكر مخطط محدد

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Ticket Title",
    "drawingId": 1,
    "status": "open"
  }
]
```

---

### Discipline Routes (`/api/disciplines`)

#### GET `/api/disciplines`
**الوصف**: الحصول على قائمة التخصصات

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Architecture",
    "description": "Architectural discipline",
    "code": "ARCH",
    "color": "#FF0000",
    "companyId": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST `/api/disciplines`
**الوصف**: إنشاء تخصص جديد

**Authentication**: مطلوب

**Request Body**:
```json
{
  "name": "Architecture",
  "description": "Architectural discipline",  // Optional
  "code": "ARCH",  // Optional
  "color": "#FF0000"  // Optional
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Architecture",
  "companyId": 1
}
```

---

### Floor Routes (`/api/floors`)

#### GET `/api/floors`
**الوصف**: الحصول على قائمة الطوابق

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Ground Floor",
    "level": "0",
    "description": "Ground floor description",
    "projectId": null,
    "sortOrder": "0",
    "companyId": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### Saved Views Routes (`/api/saved-views`)

#### GET `/api/saved-views`
**الوصف**: الحصول على العروض المحفوظة للمستخدم

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "My View",
    "type": "tickets",
    "data": {
      "filters": {...}
    },
    "userId": 1,
    "isShared": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET `/api/saved-views/:id`
**الوصف**: الحصول على عرض محفوظ محدد

**Authentication**: مطلوب

**Response** (200):
```json
{
  "id": 1,
  "name": "My View",
  "type": "tickets",
  "data": {...},
  "userId": 1
}
```

---

#### POST `/api/saved-views`
**الوصف**: إنشاء عرض محفوظ جديد

**Authentication**: مطلوب

**Request Body**:
```json
{
  "name": "My View",
  "type": "tickets",
  "data": {
    "filters": {...}
  },
  "isShared": false,  // Optional
  "companyId": 1
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "My View",
  "type": "tickets",
  "userId": 1
}
```

---

#### PUT `/api/saved-views/:id`
**الوصف**: تحديث عرض محفوظ

**Authentication**: مطلوب (المالك فقط)

**Request Body**:
```json
{
  "name": "Updated View",
  "data": {...}
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Updated View"
}
```

---

#### DELETE `/api/saved-views/:id`
**الوصف**: حذف عرض محفوظ

**Authentication**: مطلوب (المالك فقط)

**Response** (204): No Content

---

### File Upload Routes

#### PUT `/api/upload`
**الوصف**: رفع ملف عام (PDF, PNG, JPG)

**Authentication**: مطلوب

**Request**: `multipart/form-data`
- `file`: الملف (max 50MB)

**Response** (200):
```json
{
  "success": true,
  "fileUrl": "/uploads/auth:1_1234567890.png",
  "fileName": "original.png",
  "fileSize": 1024000,
  "mimeType": "image/png"
}
```

---

#### GET `/uploads/*`
**الوصف**: الحصول على ملف مرفوع

**Authentication**: غير مطلوب (public)

**Response**: File content with appropriate Content-Type

---

#### GET `/objects/:objectPath(*)`
**الوصف**: الحصول على ملف من object storage

**Authentication**: مطلوب

**Response**: File content

---

#### POST `/api/objects/upload`
**الوصف**: الحصول على URL للرفع

**Authentication**: مطلوب

**Response** (200):
```json
{
  "uploadURL": "/api/upload"
}
```

---

#### PUT `/api/attachments`
**الوصف**: ربط مرفق برسالة

**Authentication**: مطلوب

**Request Body**:
```json
{
  "attachmentURL": "/uploads/file.pdf",
  "fileName": "file.pdf"
}
```

**Response** (200):
```json
{
  "objectPath": "/uploads/file.pdf",
  "fileName": "file.pdf"
}
```

---

### Push Notification Routes (`/api/push`)

#### POST `/api/push/subscribe`
**الوصف**: الاشتراك في Push Notifications

**Authentication**: مطلوب

**Request Body**:
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response** (200):
```json
{
  "message": "Subscription saved successfully"
}
```

---

#### POST `/api/push/unsubscribe`
**الوصف**: إلغاء الاشتراك في Push Notifications

**Authentication**: مطلوب

**Request Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

**Response** (200):
```json
{
  "message": "Subscription removed successfully"
}
```

---

#### POST `/api/push/send`
**الوصف**: إرسال إشعار push يدوياً

**Authentication**: مطلوب

**Request Body**:
```json
{
  "userId": 1,
  "title": "Notification Title",
  "body": "Notification body",
  "icon": "/icons/icon.png",  // Optional
  "badge": "/icons/badge.png",  // Optional
  "data": {...}  // Optional
}
```

**Response** (200):
```json
{
  "message": "Notifications sent successfully",
  "count": 1
}
```

---

#### GET `/api/push/vapid-public-key`
**الوصف**: الحصول على VAPID Public Key

**Authentication**: غير مطلوب

**Response** (200):
```json
{
  "publicKey": "VAPID_PUBLIC_KEY"
}
```

---

### Search Routes (`/api/search`)

#### GET `/api/search/:query`
**الوصف**: البحث في الرسائل

**Authentication**: مطلوب

**Response** (200):
```json
[
  {
    "id": 1,
    "content": "Search result",
    "channelId": 1,
    "userId": 1
  }
]
```

---

## Authentication & Authorization

### JWT Token Structure

**Token Payload**:
```json
{
  "userId": "1",
  "email": "user@example.com",
  "id": 1,
  "companyId": 1,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Authentication Methods

1. **JWT Token** (مفضل):
   - Header: `Authorization: Bearer <token>`
   - يتم إرجاعه عند التسجيل/تسجيل الدخول
   - يتم تخزينه في localStorage من قبل العميل

2. **Session-based** (للتوافق مع Replit Auth):
   - يتم استخدام cookies تلقائياً
   - يتم التحقق من الجلسة عبر middleware

### Middleware Requirements

#### `isAuthenticated`
- يتحقق من وجود JWT token أو session صالحة
- يضيف `req.user` مع بيانات المستخدم
- يضيف `req.companyId` من بيانات المستخدم

#### `requireAdmin`
- يتحقق من أن المستخدم لديه دور `admin`
- يرمي خطأ إذا لم يكن admin

#### `requireCompanyManager`
- يتحقق من أن المستخدم لديه دور `company_manager` أو `admin`
- يرمي خطأ إذا لم يكن company_manager

### Role-Based Access Control

#### Roles:
1. **admin**: صلاحيات كاملة
   - إدارة المستخدمين (تغيير الأدوار، حذف)
   - إدارة القنوات (تحديث، إضافة/إزالة أعضاء)
   - جميع الصلاحيات الأخرى

2. **company_manager**: إدارة الشركة
   - إدارة القنوات (تحديث، إضافة/إزالة أعضاء)
   - الوصول إلى جميع قنوات الشركة
   - جميع صلاحيات member

3. **member**: مستخدم عادي
   - الوصول فقط للقنوات التي هو عضو فيها
   - إنشاء رسائل في القنوات التي هو عضو فيها
   - إدارة رسائله الخاصة

---

## Multi-Tenancy

### Company Isolation

جميع الجداول تحتوي على `company_id` لضمان عزل البيانات:

- `users.company_id`
- `channels.company_id`
- `messages.company_id`
- `direct_messages.company_id`
- `drawings.company_id`
- `tickets.company_id`
- `disciplines.company_id`
- `floors.company_id`
- `projects.company_id`
- `reactions.company_id`
- `notifications.company_id`
- `attachments.company_id`
- `saved_views.company_id`

### Tenant Resolver Middleware

**الوظيفة**: تحديد الشركة من الطلب

**المصادر المحتملة**:
1. `x-company-id` header
2. `req.user.companyId` (من JWT/Session)
3. Subdomain (إذا كان مدعوماً)

**التنفيذ في Laravel**:
```php
// Middleware: TenantResolver
public function handle($request, Closure $next)
{
    $companyId = $request->header('x-company-id') 
        ?? $request->user()?->company_id
        ?? $this->resolveFromSubdomain($request);
    
    if (!$companyId) {
        return response()->json(['error' => 'Company ID required'], 400);
    }
    
    $request->merge(['companyId' => $companyId]);
    return $next($request);
}
```

### Data Filtering

**مثال في Laravel**:
```php
// جميع الاستعلامات يجب أن تحتوي على company_id
$messages = Message::where('company_id', $request->companyId)
    ->where('channel_id', $channelId)
    ->get();
```

---

## File Uploads & Storage

### Supported File Types

- **PDF**: `application/pdf`
- **Images**: `image/png`, `image/jpeg`, `image/jpg`
- **Max File Size**: 50MB

### Storage Structure

**Local Development**:
```
uploads/
  ├── auth:1_1234567890.png
  ├── auth:1_1234567890.pdf
  └── drawings/
      ├── 1_R1_abc123_1234567890.pdf
      └── annotation-page-1.png
```

**File Naming Convention**:
- عام: `{userId}_{timestamp}.{ext}`
- مخططات: `{drawingId}_{revisionNo}_{timestamp}.pdf`
- تعليقات: `annotation-page-{pageNumber}.png`

### Upload Endpoints

1. **PUT `/api/upload`**: رفع ملف عام
2. **POST `/api/drawings/:id/upload`**: رفع ملف مخطط
3. **POST `/api/drawings/upload-manual`**: رفع مخطط يدوي
4. **POST `/api/drawings/annotations/save`**: حفظ تعليقات (multiple files)

---

## WebSocket Events

### Connection Flow

1. **Client connects** to `ws://host/ws`
2. **Server authenticates** via session
3. **Client sends auth message**:
   ```json
   {
     "type": "auth",
     "userId": "1"
   }
   ```
4. **Server initializes** channel subscriptions
5. **Server broadcasts** user online status

### Event Types

#### Client → Server

##### `auth`
```json
{
  "type": "auth",
  "userId": "1"
}
```

##### `subscribe_channel`
```json
{
  "type": "subscribe_channel",
  "channelId": "1"
}
```

##### `typing`
```json
{
  "type": "typing",
  "channelId": "1",
  "userName": "User Name"
}
```

#### Server → Client

##### `new_message`
```json
{
  "type": "new_message",
  "channelId": 1,
  "message": {
    "id": 1,
    "content": "Message content",
    "userId": 1,
    "user": {...},
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

##### `new_dm`
```json
{
  "type": "new_dm",
  "dm": {
    "id": 1,
    "content": "Direct message",
    "fromUserId": 1,
    "toUserId": 2,
    "sender": {...},
    "recipient": {...}
  },
  "toUserId": 2,
  "fromUserId": 1
}
```

##### `channel_created`
```json
{
  "type": "channel_created",
  "channel": {
    "id": 1,
    "name": "new-channel",
    "isPrivate": false
  }
}
```

##### `new_reaction`
```json
{
  "type": "new_reaction",
  "messageId": 1,
  "channelId": 1,
  "reaction": {
    "id": 1,
    "messageId": 1,
    "userId": 1,
    "icon": "👍",
    "user": {...}
  }
}
```

##### `remove_reaction`
```json
{
  "type": "remove_reaction",
  "messageId": 1,
  "channelId": 1,
  "userId": 1,
  "icon": "👍"
}
```

##### `message_updated`
```json
{
  "type": "message_updated",
  "message": {
    "id": 1,
    "content": "Updated content",
    "editedAt": "2024-01-01T00:00:00Z"
  }
}
```

##### `message_deleted`
```json
{
  "type": "message_deleted",
  "messageId": 1
}
```

##### `typing`
```json
{
  "type": "typing",
  "channelId": 1,
  "userId": "1",
  "userName": "User Name"
}
```

##### `user_status`
```json
{
  "type": "user_status",
  "userId": "1",
  "isOnline": true
}
```

##### `new_notification`
```json
{
  "type": "new_notification",
  "notification": {
    "type": "mention",
    "fromUser": {...},
    "channel": {...},
    "content": "You were mentioned"
  }
}
```

### Channel Subscriptions

- المستخدمون مشتركون تلقائياً في القنوات التي هم أعضاء فيها
- يمكن الاشتراك يدوياً في قناة عامة عبر `subscribe_channel`
- الرسائل تُبث فقط للمشتركين في القناة

---

## ملاحظات مهمة للتحويل إلى Laravel

### 1. Database Migrations

جميع الجداول يجب إنشاؤها مع:
- Foreign Keys مع `onDelete('cascade')` حيث يناسب
- Indexes على `company_id` في جميع الجداول
- Unique constraints حيث مطلوب

### 2. Models & Relationships

استخدام Eloquent Relationships:
- `belongsTo`, `hasMany`, `hasOne`
- `belongsToMany` للعلاقات Many-to-Many

### 3. Middleware

إنشاء middleware للـ:
- Tenant Resolution
- Authentication (JWT)
- Role-based Authorization

### 4. API Resources

استخدام Laravel API Resources لتحويل البيانات:
- `UserResource`
- `MessageResource`
- `ChannelResource`
- etc.

### 5. Validation

استخدام Form Requests للتحقق من البيانات:
- `StoreMessageRequest`
- `UpdateChannelRequest`
- etc.

### 6. WebSocket

استخدام Laravel Broadcasting مع:
- Pusher أو Laravel WebSockets
- Events & Listeners
- Channels (public/private)

### 7. File Storage

استخدام Laravel Storage:
- `Storage::disk('local')` للتطوير
- `Storage::disk('s3')` للإنتاج
- File validation في Form Requests

### 8. Queue Jobs

استخدام Queues للعمليات الثقيلة:
- إرسال Push Notifications
- معالجة الملفات
- إرسال الإشعارات

---

## خاتمة

هذا التوثيق يغطي جميع نقاط API والعلاقات في المشروع. عند التحويل إلى Laravel، يجب اتباع أفضل الممارسات Laravel واستخدام الميزات المدمجة مثل Eloquent, Middleware, API Resources, وغيرها.

