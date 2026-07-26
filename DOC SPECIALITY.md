# خطة تنفيذ ميزة "التخصص الطبي" (Medical Specialty)

هذه خطة مقترحة لإضافة ميزة اختيار التخصص الطبي ودمجه في العقل المدبر للذكاء الاصطناعي (Master Prompt) لرفع دقة التعرف على المصطلحات وتنسيقها.

## 1. الآلية المقترحة (كيف ستعمل الميزة؟)

أفضل وأكثر طريقة هندسية نظيفة وموثوقة (Robust) لتنفيذ هذه الميزة هي **"الآلية المدمجة" (Hybrid Approach)**:

*   **في واجهة الإضافة (Chrome Extension):**
    *   سنضيف قائمة منسدلة (Dropdown) بتصميم أنيق داخل شاشة الإعدادات (`ProfileMenu.tsx`) تحتوي على الـ 41 تخصصاً التي ذكرتها.
    *   سيتم حفظ الخيار محلياً في المتصفح باستخدام `settingsStore.ts`.
*   **في التواصل مع الخوادم (API Payload):**
    *   عندما يقوم الطبيب بتسجيل الصوت وإرسال الملاحظة للتحليل، ستقوم الإضافة بإرسال "التخصص المختار" كجزء من البيانات (Payload) في طلب إنشاء الملاحظة `POST /inbox-notes`.
*   **في الخادم الخلفي (Laravel Backend):**
    *   سنقوم بحفظ التخصص في قاعدة البيانات (إما بربطه بملف الطبيب `User` أو بالملاحظة نفسها `InboxNote`).
    *   في ملف `TextAnalysisService.php`، سيقوم النظام بجلب هذا التخصص وحقنه برمجياً داخل الـ `Master Prompt` قبل إرساله إلى OCI (الذكاء الاصطناعي).

## 2. صيغة البرومبت (Prompt) بعد التعديل

في ملف `AIPromptConstants.php`، سنضيف قاعدة جديدة وصارمة (Directive) في قسم الـ `RULES` لكل من `MASTER_REPAIR_ONLY_PROMPT` و `MASTER_FORMAT_ONLY_PROMPT`.

**البرومبت المقترح سيكون بهذا الشكل (الجزء المضاف):**

```text
SYSTEM DIRECTIVE: You are a medical ASR repair engine. The input is RAW speech-to-text output of a physician's dictation. 
...
[الأوامر الحالية]
...

RULES:
...
[القواعد الحالية]
...
7. CONTEXTUAL SPECIALTY FOCUS: The physician dictating this note is a specialist in "{{DOCTOR_SPECIALTY}}". You MUST use this specialty context to disambiguate acronyms, resolve phonetic errors, and accurately interpret clinical terminology relevant to this field. (e.g. if the specialty is Cardiology, 'EF' means Ejection Fraction).

RAW ASR TRANSCRIPT:
{{RAW_TEXT_FROM_WHISPER}}
```

*سيتم استبدال `{{DOCTOR_SPECIALTY}}` برمجياً في الخلفية بالتخصص الذي اختاره الطبيب.*

## 3. التعديلات التقنية المطلوبة (Proposed Changes)

> [!IMPORTANT]
> يرجى الموافقة على هذا التوزيع التقني قبل البدء في تعديل الأكواد لتجنب أي تعارض في البيانات.

### في إضافة جوجل كروم (Frontend)
*   **تحديث المخزن (Store):** إضافة `specialty: string` إلى `settingsStore.ts`.
*   **تحديث الواجهة (UI):** إضافة قائمة منسدلة (Select Dropdown) في `ProfileMenu.tsx` لعرض قائمة الـ 41 تخصصاً.
*   **تحديث الارسال (API):** تعديل دالة الإرسال في `apiClient.ts` لتضمين حقل `specialty` عند إنشاء ملاحظة جديدة.

### في الواجهة الخلفية (Backend - Laravel)
*   **تعديل قاعدة البيانات:** إضافة حقل `specialty` إلى جدول الملاحظات (`inbox_notes`) أو جدول المستخدمين (`users`). (أقترح جدول المستخدمين `users` ليكون ثابتاً للطبيب).
*   **تحديث متحكمات API:** السماح باستقبال حقل التخصص وتحديثه من خلال الـ API.
*   **تحديث الـ AI Prompts:** 
    1. إضافة المتغير `{{DOCTOR_SPECIALTY}}` في ملف `AIPromptConstants.php`.
    2. في `TextAnalysisService.php`، استخدام دالة `str_replace` لاستبدال المتغير بالتخصص الفعلي للطبيب قبل استدعاء خدمة OCI.

## Open Questions
هل تفضل أن يتم حفظ التخصص بشكل دائم في حساب الطبيب في قاعدة البيانات (Backend Database)، أم أن يتم حفظه فقط في المتصفح وإرساله مع كل ملاحظة بشكل ديناميكي؟ (كلا الطريقتين ممكنة، الأولى أفضل للثبات عند استخدام أجهزة متعددة).
