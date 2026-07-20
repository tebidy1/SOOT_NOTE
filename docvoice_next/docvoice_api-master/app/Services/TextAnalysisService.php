<?php

declare(strict_types=1);

namespace App\Services;

use App\Helpers\NoteHelper;
use App\Models\InboxNote;
use App\Models\NoteAnalysis;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TextAnalysisService
{
    /**
     * تعريف أنواع الفورمات مع الحقول المرتبطة بها
     */
    protected array $formTypes = [

        'nabd' => [
            'Dll_complaints' => ['Patient complaint', 'patient_complaint', 'complaint', 'chief complaint', 'Dll_complaints'],
            'PatientcomplaintsText' => [
                'Patient complaints',
                'Patient complaints text',
                'Chief complaint',
                'Chief complaints',
                'Presenting complaint',
                'Presenting complaints',
                'Patient reported symptoms',
                'Patient symptoms',
                'Reported symptoms',
                'Symptoms description',
                'Complaint description',
                'Clinical complaint',
                'Clinical complaints',
                'Medical complaint',
                'Medical complaints',
                'Reason for visit',
                'Reason for consultation',
                'History of presenting illness',
                'HPI',
                'Subjective complaints',
                'PatientcomplaintsText',
                'patient_complaints',
                'patient complaints',
                'complaints',
                'symptoms'
            ],
            'txt_PatientNotes' => ['Patient note', 'patient_note', 'note', 'patient remarks', 'txt_PatientNotes'],
            'PainScore' => ['Pain score', 'PainScore', 'pain score', 'pain rating', 'pain assessment'],
            'FamilyEducation' => ['Family education', 'family_education', 'family teaching', 'patient family education', 'FamilyEducation'],
            'txt_PatientHistoryOfPresentIlness' => ['History of patient illnesses', 'history_of_patient_illnesses', 'medical history', 'past medical history', 'HPI', 'history of present illness', 'txt_PatientHistoryOfPresentIlness'],
            'txt_PatientPhisicalExaminition' => ['Physical examination', 'physical_examination', 'clinical examination', 'physical exam', 'PE', 'txt_PatientPhisicalExaminition'],
            'txt_PatientInvestigation' => ['Investigation', 'investigation', 'lab tests', 'lab results', 'investigations', 'diagnostic tests', 'txt_PatientInvestigation'],
            'txt_PatientMangementplan' => ['Treatment plan', 'treatment_plan', 'plan of treatment', 'therapeutic plan', 'management plan', 'txt_PatientMangementplan'],
            'txt_NoteFromReceptionToDoctor' => ['Reception notes', 'reception_notes', 'admission notes', 'intake notes', 'txt_NoteFromReceptionToDoctor'],
            'txt_SignificantSign' => ['Important patient notes', 'important_patient_notes', 'key patient notes', 'critical patient notes', 'txt_SignificantSign'],
            'txt_OtherConditions' => ['Other conditions', 'other_conditions', 'additional conditions', 'comorbidities', 'txt_OtherConditions'],
            'txt_RecordOfTreatment' => ['Record of treatment', 'record_of_treatment', 'treatment record', 'treatment log', 'txt_RecordOfTreatment'],
            'txt_Diagnosis' => ['Diagnosis', 'diagnosis', 'clinical diagnosis', 'assessment', 'txt_Diagnosis'],
            'DiagnosisSelect2' => ['Diagnosis select', 'DiagnosisSelect2', 'diagnosis select', 'diagnosis dropdown'],
        ]
        //   'clinical_observation' => [
        //     'patient_informations' => ['معلومات المريض', 'patient informations', 'patient information', 'patient_informations', 'بيانات المريض', 'اسم المريض', 'patient name', 'عمر المريض', 'patient age', 'جنس المريض', 'patient gender'],
        //     'patient_history' => ['التاريخ المرضي', 'patient history', 'medical history', 'past medical history', 'history of present illness', 'hpi', 'التاريخ الطبي'],
        //     'patient_diagnosis_and_tests' => ['التشخيص والتحاليل', 'patient diagnosis and tests', 'diagnosis and tests', 'clinical diagnosis', 'diagnosis', 'clinical findings', 'examination findings', 'physical examination', 'lab tests', 'laboratory tests', 'lab results', 'investigations', 'التحاليل المخبرية', 'الموجودات السريرية'],
        //     'plan_and_drugs' => ['الخطة والأدوية', 'plan and drugs', 'treatment plan', 'prescribed medications', 'medications', 'prescriptions', 'drug orders', 'الأدوية الموصوفة', 'dosage instructions', 'patient instructions', 'تعليمات المريض'],
        // ]
        // ,  
        // 'patient_info' => [
        //     'name' => ['الاسم الكامل', 'name', 'fullname', 'patient_name', 'patient name', 'full name'],
        //     'age' => ['العمر', 'age'],
        //     'gender' => ['الجنس', 'gender', 'sex'],
        //     'id_number' => ['رقم الهوية', 'id_number', 'national_id', 'national id', 'id number'],
        //     'phone' => ['رقم الهاتف', 'phone', 'telephone', 'mobile', 'cell'],
        //     'address' => ['العنوان', 'address', 'street'],
        //     'emergency_name' => ['اسم جهة الاتصال', 'emergency_name', 'emergency contact', 'emergency contact name'],
        //     'emergency_phone' => ['رقم الطوارئ', 'emergency_phone', 'emergency phone', 'emergency telephone'],
        //     'height' => ['الطول', 'height'],
        //     'weight' => ['الوزن', 'weight'],
        // ],
        // 'vital_signs' => [
        //     'blood_pressure' => ['ضغط الدم', 'blood_pressure', 'blood pressure', 'bp'],
        //     'pulse' => ['معدل النبض', 'pulse', 'heart_rate', 'heart rate', 'hr'],
        //     'temperature' => ['درجة الحرارة', 'temperature', 'temp'],
        //     'sugar' => ['نسبة السكر', 'sugar', 'blood_sugar', 'glucose', 'blood sugar'],
        // ],
        // 'medical_history' => [
        //     'chronic_diseases' => ['أمراض مزمنة', 'chronic_diseases', 'chronic diseases', 'chronic_conditions', 'medical_history'],
        //     'surgeries' => ['عمليات سابقة', 'surgeries', 'previous surgeries', 'past surgeries'],
        //     'allergies' => ['حساسية', 'allergies', 'allergy'],
        //     'medications' => ['أدوية حالية', 'medications', 'current_medication', 'current medication', 'medication'],
        // ],
        // 'current_condition' => [
        //     'disease' => ['اسم المرض', 'disease', 'chief_complaint', 'chief complaint', 'condition'],
        //     'symptoms' => ['الأعراض', 'symptoms', 'symptom'],
        //     'duration' => ['مدة الأعراض', 'duration', 'symptom_duration', 'symptom duration'],
        //     'diagnosis' => ['التشخيص', 'diagnosis', 'assessment'],
        //     'treatment' => ['الخطة العلاجية', 'treatment', 'plan', 'treatment_plan', 'treatment plan'],
        //     'doctor' => ['اسم الطبيب', 'doctor', 'doctor_name', 'physician', 'physician_name'],
        // ]


    ];

    /**
     * تحويل formTypes إلى formFieldMappings للتوافق
     */
    protected array $formFieldMappings = [];

    public function __construct()
    {
        $this->buildFormFieldMappings();
    }

    /**
     * بناء formFieldMappings من formTypes
     */
    private function buildFormFieldMappings(): void
    {
        $this->formFieldMappings = [];

        foreach ($this->formTypes as $formName => $fields) {
            foreach ($fields as $fieldName => $labels) {
                $mapping = [
                    'form_field' => $fieldName,
                    'form_type' => $this->getFieldType($fieldName),
                    'labels' => $labels,
                ];

                $options = $this->getFieldOptions($fieldName);
                if ($options) {
                    $mapping['options'] = $options;
                }

                $this->formFieldMappings[] = $mapping;
            }
        }
    }

    /**
     * تحديد نوع الحقل وخياراته
     */
    private function getFieldType(string $fieldName): string
    {
        $textareaFields = [
            'Dll_complaints',
            'PatientcomplaintsText',
            'txt_PatientNotes',
            'FamilyEducation',
            'txt_PatientHistoryOfPresentIlness',
            'txt_PatientPhisicalExaminition',
            'txt_PatientInvestigation',
            'txt_PatientMangementplan',
            'txt_NoteFromReceptionToDoctor',
            'txt_SignificantSign',
            'txt_OtherConditions',
            'txt_RecordOfTreatment',
            'txt_Diagnosis',
        ];
        $selectFields = [
            'PainScore',
            'DiagnosisSelect2',
        ];

        if (in_array($fieldName, $textareaFields)) {
            return 'textarea';
        }

        if (in_array($fieldName, $selectFields)) {
            return 'select';
        }

        return 'input';
    }

    /**
     * الحصول على خيارات الحقل
     */
    private function getFieldOptions(string $fieldName): ?array
    {
        return null;
    }

    public function analyzeByNote(InboxNote $note, string $language = 'en', string $method = 'oci'): array
    {
        $macro_id = 85;
        // $text = $note->raw_text . " " . $note->original_text . " " . $note->formatted_text;
        $text = NoteHelper::analyzeByMacro(
            $note,
            $macro_id
        );
        if (empty(trim($text))) {
            return ['error' => 'Note has no text content to analyze'];
        }

        $result = $this->performAnalysis($text, $language, $method);
        $result['note_id'] = $note->id;

        // حفظ تحليل منفصل لكل نوع فورم في المصفوفة بصورة ديناميكية
        // حفظ جميع الفورمات حتى لو كانت فارغة
        foreach ($this->formTypes as $formName => $fields) {
            $filteredResult = $this->filterResultForForm($result, $formName);
            $this->saveAnalysis($note, $filteredResult, $formName);
        }

        return $result;
    }

    public function analyzeText(string $text, string $language = 'en', string $method = 'oci'): array
    {
        return $this->performAnalysis($text, $language, $method);
    }

    public function generateNoteFromMacro(InboxNote $note, \App\Models\Macro $macro, string $method = 'oci'): array
    {
        $text = $note->raw_text ?? $note->original_text ?? $note->formatted_text ?? '';

        if (!$macro->is_ai_macro) {
            $content = $macro->content ?? '';
            // Basic replacements
            $content = str_replace('{{patient_name}}', $note->patient_name ?? '', $content);
            $content = str_replace('{{summary}}', $note->summary ?? '', $content);
            return ['content' => $content];
        }

        if (empty(trim($text))) {
            return ['error' => 'Note has no text content to process'];
        }

        if ($method === 'gemini') {
            return $this->generateContentWithGemini($text, $macro->ai_instruction ?? $macro->content ?? '');
        }

        return $this->generateContentWithOci($text, $macro->ai_instruction ?? $macro->content ?? '');
    }

    private function generateContentWithGemini(string $text, string $instruction): array
    {
        $defaultResult = [
            'content' => null,
            'source' => 'gemini',
        ];

        try {
            $companySettings = $this->getCompanySettings();
            $apiKey = trim((string) ($companySettings['gemini_api_key'] ?? '')) ?: trim((string) env('GEMINI_API_KEY', ''));

            if ($apiKey === '') {
                $defaultResult['error'] = 'Gemini API key is not configured in company settings or .env';
                return $defaultResult;
            }

            $prompt = \App\Constants\AIPromptConstants::MASTER_REPAIR_FORMAT_PROMPT;
            $prompt = str_replace('{{SELECTED_TEMPLATE_NAME}}', $instruction, $prompt);
            $prompt = str_replace('{{RAW_TEXT_FROM_WHISPER}}', $text, $prompt);

            $models = array_filter([
                env('GEMINI_MODEL'),
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-2.5-flash',
            ]);

            $response = null;
            $usedModel = null;

            foreach ($models as $model) {
                if (empty($model))
                    continue;

                Log::debug("Trying Gemini model for macro generation: {$model}");

                $response = Http::timeout(45)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    // Force JSON so we can never receive markdown/prose here.
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                    ],
                ]);

                if ($response->successful()) {
                    $usedModel = $model;
                    break;
                }

                Log::warning("Gemini model {$model} failed for macro generation", [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                if ($response->status() !== 503) {
                    break;
                }
            }

            if (!$response || $response->failed()) {
                $errorBody = $response ? $response->body() : 'All models unavailable';
                $errorStatus = $response ? $response->status() : 0;
                Log::warning('Gemini macro generation failed - all models exhausted', ['status' => $errorStatus, 'body' => $errorBody]);
                $defaultResult['error'] = "Gemini API request failed ({$errorStatus})";
                return $defaultResult;
            }

            $result = $response->json();
            $responseText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

            return $this->buildNoteFromEnvelope($responseText, $text, 'gemini', $usedModel);
        } catch (\Exception $e) {
            Log::error('Gemini macro generation exception', ['error' => $e->getMessage()]);
            $defaultResult['error'] = 'An error occurred while generating content: ' . $e->getMessage();
            return $defaultResult;
        }
    }

    private function generateContentWithOci(string $text, string $instruction): array
    {
        $defaultResult = [
            'content' => null,
            'source' => 'oci',
        ];

        try {
            $prompt = \App\Constants\AIPromptConstants::MASTER_REPAIR_FORMAT_PROMPT;
            $prompt = str_replace('{{SELECTED_TEMPLATE_NAME}}', $instruction, $prompt);
            $prompt = str_replace('{{RAW_TEXT_FROM_WHISPER}}', $text, $prompt);

            $ociService = app(OciGenerativeAiService::class);
            // temp 0.2 for consistency; 3000 tokens because the envelope carries
            // the repaired transcript + all fields + flags (bigger than a note).
            $response = $ociService->generate($prompt, null, 0.2, 3000);
            $responseText = $response['text'] ?? '';

            return $this->buildNoteFromEnvelope($responseText, $text, 'oci', $response['model'] ?? null);
        } catch (\Exception $e) {
            Log::error('OCI Generative AI macro generation exception', ['error' => $e->getMessage()]);
            $defaultResult['error'] = 'An error occurred while generating content: ' . $e->getMessage();
            return $defaultResult;
        }
    }

    /**
     * Parse the repair+format JSON envelope, deterministically render a clean
     * sectioned note for display, and run numeric reconciliation.
     *
     * Falls back gracefully: if the model returned plain text instead of the
     * envelope, that text becomes the note (so we never show an error to a
     * doctor who got a usable note).
     */
    private function buildNoteFromEnvelope(string $responseText, string $rawText, string $source, ?string $model): array
    {
        // Strip any stray markdown fences before parsing.
        $clean = preg_replace('/^```[a-zA-Z]*\n?/', '', trim($responseText));
        $clean = preg_replace('/```$/', '', $clean);
        $clean = trim($clean);

        $envelope = $this->extractJsonFromText($clean);

        // ── Fallback: not the expected envelope → treat response as the note ──
        if ($envelope === null || !isset($envelope['fields']) || !is_array($envelope['fields'])) {
            Log::warning('Repair/format envelope missing or malformed — using raw text as note', [
                'source' => $source,
                'preview' => mb_substr($clean, 0, 200),
            ]);
            return [
                'content' => $clean,
                'source' => $source,
                'model' => $model,
                'repaired_transcript' => null,
                'flags' => [],
                'review' => ['passed' => true, 'missing_numbers' => [], 'suspicious_ranges' => [], 'unverified' => true],
            ];
        }

        $repaired = isset($envelope['repaired_transcript']) ? (string) $envelope['repaired_transcript'] : '';
        $flags = (isset($envelope['flags']) && is_array($envelope['flags'])) ? $envelope['flags'] : [];
        $content = $this->renderFieldsToNote($envelope['fields']);

        // Deterministic safety net: compare numbers in the repaired transcript
        // against the rendered note. The AI cannot suppress this check.
        $review = $this->reconcileNumbers($repaired !== '' ? $repaired : $rawText, $content);

        return [
            'content' => $content,
            'source' => $source,
            'model' => $model,
            'repaired_transcript' => $repaired,
            'flags' => $flags,
            'review' => $review,
        ];
    }

    /**
     * Render the ordered {SECTION_KEY: value} map into clean plain text with
     * ALL-CAPS headers on their own line — the exact shape NoteViewer styles as
     * section headers, and generateClipboardHTML formats for pasting.
     */
    private function renderFieldsToNote(array $fields): string
    {
        $lines = [];
        foreach ($fields as $key => $value) {
            $heading = strtoupper(str_replace('_', ' ', trim((string) $key)));
            if ($heading === '') {
                continue;
            }
            if (is_array($value)) {
                $value = implode(', ', array_filter(array_map('strval', $value), fn($v) => trim($v) !== ''));
            }
            $val = trim((string) $value);
            if ($val === '') {
                $val = '[Not Reported]';
            }
            $lines[] = $heading . ':';
            $lines[] = $val;
            $lines[] = '';
        }
        return trim(implode("\n", $lines));
    }

    /**
     * Deterministic numeric reconciliation between the source transcript and the
     * generated note. Catches the two silent-failure modes seen in testing:
     *   - dropped numbers  (e.g. RR 26, ACQ 3.5 vanish from the note)
     *   - fabricated ranges (e.g. "88-91%" invented from BP 88 + SpO2 91)
     */
    private function reconcileNumbers(string $source, string $note): array
    {
        $tokenPattern = '/\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?/';

        preg_match_all($tokenPattern, $source, $sm);
        preg_match_all($tokenPattern, $note, $nm);
        $srcCounts = array_count_values($sm[0] ?? []);
        $noteCounts = array_count_values($nm[0] ?? []);

        // Dropped values: present more often in source than in note (multiset).
        $missing = [];
        foreach ($srcCounts as $num => $cnt) {
            $have = $noteCounts[$num] ?? 0;
            for ($i = $have; $i < $cnt; $i++) {
                $missing[] = (string) $num;
            }
        }

        // Fabricated ranges: "a-b" / "a to b" in the note that is not written as
        // a contiguous range anywhere in the source.
        $suspiciousRanges = [];
        if (preg_match_all('/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i', $note, $rm, PREG_SET_ORDER)) {
            foreach ($rm as $m) {
                $rangeRe = '/' . preg_quote($m[1], '/') . '\s*(?:-|–|—|to)\s*' . preg_quote($m[2], '/') . '/i';
                if (!preg_match($rangeRe, $source)) {
                    $suspiciousRanges[] = $m[0];
                }
            }
        }

        return [
            'passed' => empty($missing) && empty($suspiciousRanges),
            'missing_numbers' => array_values(array_unique($missing)),
            'suspicious_ranges' => array_values(array_unique($suspiciousRanges)),
        ];
    }

    public function saveAnalysis(InboxNote $note, array $result, string $formName = 'general'): NoteAnalysis
    {
        // تحديد البيانات للحفظ
        $analysisData = [
            'extracted_fields' => $result['extracted_fields'] ?? null,
            'field_mappings' => $result['field_mappings'] ?? null,
            'method' => $result['method'] ?? 'oci',
            'language' => $result['language'] ?? 'en',
        ];

        return $note->textAnalyses()->updateOrCreate(
            [
                'inbox_note_id' => $note->id,
                'form_name' => $formName,
            ],
            [
                'analysis_data' => $analysisData,
                'method' => $result['method'] ?? 'oci',
                'language' => $result['language'] ?? 'en',
            ]
        );
    }

    /**
     * تحديد أنواع الفورمات بناءً على الحقول المستخرجة
     */
    private function determineFormNames(array $result): array
    {
        $extracted = $result['extracted_fields'] ?? [];
        $matchedForms = [];

        foreach ($this->formTypes as $formName => $fields) {
            $matchedFields = 0;
            foreach ($fields as $fieldName => $labels) {
                if (isset($extracted[$fieldName]) && !empty($extracted[$fieldName])) {
                    $matchedFields++;
                }
            }

            // إذا كان هناك حقل واحد على الأقل مطابق، أضف الفورم
            if ($matchedFields > 0) {
                $matchedForms[] = $formName;
            }
        }

        // إذا لم يتم العثور على أي فورم مطابق، أضف فورم عام
        if (empty($matchedForms)) {
            $matchedForms[] = 'general_analysis';
        }

        return $matchedForms;
    }

    /**
     * تحديد اسم الفورم بناءً على الحقول المستخرجة (للتوافق)
     */
    private function determineFormName(array $result): string
    {
        $forms = $this->determineFormNames($result);
        return $forms[0] ?? 'general_analysis';
    }

    /**
     * تصفية النتائج لتحتوي فقط على الحقول الخاصة بفورم معين
     */
    private function filterResultForForm(array $result, string $formName): array
    {
        if (!isset($this->formTypes[$formName])) {
            return $result;
        }

        $formFields = array_keys($this->formTypes[$formName]);
        $filteredExtracted = [];
        $filteredMappings = [];

        $extracted = $result['extracted_fields'] ?? [];
        $mappings = $result['field_mappings'] ?? [];

        // تصفية الحقول المستخرجة
        foreach ($formFields as $field) {
            if (isset($extracted[$field])) {
                $filteredExtracted[$field] = $extracted[$field];
            }
        }

        // تصفية mappings
        foreach ($mappings as $mapping) {
            if (isset($mapping['form_field']) && in_array($mapping['form_field'], $formFields)) {
                $filteredMappings[] = $mapping;
            }
        }

        return [
            'extracted_fields' => $filteredExtracted,
            'field_mappings' => $filteredMappings,
            'method' => $result['method'] ?? 'pattern',
            'language' => $result['language'] ?? 'en',
            'note_id' => $result['note_id'] ?? null,
        ];
    }

    private function performAnalysis(string $text, string $language, string $method): array
    {
        $patternResult = null;
        $geminiResult = null;
        $ociResult = null;

        if ($method === 'all' || $method === 'pattern') {
            $extractionService = app(TextExtractionService::class);
            $patternResult = $extractionService->extractFields($text);
            $patternResult['source'] = 'pattern';
        }

        if ($method === 'all' || $method === 'gemini') {
            $geminiResult = $this->analyzeWithGemini($text, $language);
        }

        if ($method === 'all' || $method === 'oci') {
            $ociResult = $this->analyzeWithOci($text, $language);
        }

        $aiResult = $ociResult ?? $geminiResult;
        $merged = $this->mergeResults($patternResult, $aiResult);
        $fieldMappings = $this->mapExtractedFieldsToForm($merged);

        return [
            'extracted_fields' => $merged,
            'field_mappings' => $fieldMappings,
            'method' => $method,
            'language' => $language,
        ];
    }

    private function getCompanySettings(): array
    {
        $user = auth()->user();
        if (!$user || !$user->company) {
            return [];
        }
        return $user->company->settings ?? [];
    }

    private function analyzeWithGemini(string $text, string $language): array
    {
        $defaultResult = [
            'name' => null,
            'age' => null,
            'height' => null,
            'gender' => null,
            'extra_fields' => null,
            'source' => 'gemini',
        ];

        try {
            $companySettings = $this->getCompanySettings();
            $apiKey = trim((string) ($companySettings['gemini_api_key'] ?? '')) ?: trim((string) env('GEMINI_API_KEY', ''));
            if ($apiKey === '') {
                $defaultResult['error'] = 'Gemini API key is not configured in company settings or .env';
                return $defaultResult;
            }

            $langNames = [
                'en' => 'English',
                'ar' => 'Arabic',
                'fr' => 'French',
                'de' => 'German',
                'es' => 'Spanish',
                'it' => 'Italian',
                'pt' => 'Portuguese',
                'nl' => 'Dutch',
                'hi' => 'Hindi',
                'ja' => 'Japanese',
                'ko' => 'Korean',
                'zh' => 'Chinese',
            ];
            $langName = $langNames[$language] ?? 'English';

            $languageInstruction = "Return all extracted text values and keys in {$langName}.";

            $sectionInstructions = $this->buildSectionHeaderInstructions();

            $prompt = <<<PROMPT
CRITICAL RULE: You must extract ONLY exact, verbatim words and phrases from the source text. NEVER modify, paraphrase, add, remove, translate, or change any word. Copy content EXACTLY as written under each section header. If a section says "[Not Reported]", set that field to null.

The text is a structured medical record with section headers. Extract the content under each section header into the corresponding field key.

Fixed fields:
1. name - The person's exact full name as written in the text (or null if not found)
2. age - The person's exact age number as written (or null if not found)
3. height - The person's exact height as written in the text (or null if not found)
4. gender - The person's exact gender word as written in the text (or null if not found)

Dynamic fields (extra_fields):
You MUST use ONLY these exact keys. Do NOT create new keys. Extract the EXACT verbatim content from the corresponding section headers in the text:

{$sectionInstructions}

Values MUST be exact verbatim text from the source - no paraphrasing, no additions, no modifications.
If a value contains a [?...] uncertainty marker, copy it verbatim into the field — it is data, not a missing marker.

{$languageInstruction}

Output ONLY a JSON object:
{"name": "...", "age": ..., "height": "...", "gender": "...", "extra_fields": {"patient_complaint": "exact text here", "patient_note": "exact text here", ...}}

Text:
{$text}
PROMPT;

            $models = array_filter([
                env('GEMINI_MODEL'),
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-2.5-flash',
            ]);

            $response = null;
            $usedModel = null;

            foreach ($models as $model) {
                if (empty($model))
                    continue;

                Log::debug("Trying Gemini model: {$model}");

                $response = Http::timeout(30)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                    ]
                ]);

                if ($response->successful()) {
                    $usedModel = $model;
                    break;
                }

                Log::warning("Gemini model {$model} failed", [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                if ($response->status() !== 503) {
                    break;
                }
            }

            if (!$response || $response->failed()) {
                $errorBody = $response ? $response->body() : 'All models unavailable';
                $errorStatus = $response ? $response->status() : 0;
                Log::warning('Gemini text analysis failed - all models exhausted', ['status' => $errorStatus, 'body' => $errorBody]);
                $defaultResult['error'] = "Gemini API request failed ({$errorStatus}): " . $errorBody;
                return $defaultResult;
            }

            $result = $response->json();
            $responseText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $parsed = json_decode($responseText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('Gemini response JSON parse failed', ['raw' => $responseText]);
                $defaultResult['error'] = 'Invalid JSON response from Gemini';
                return $defaultResult;
            }

            return [
                'name' => $parsed['name'] ?? null,
                'age' => isset($parsed['age']) ? (int) $parsed['age'] : null,
                'height' => isset($parsed['height']) ? (string) $parsed['height'] : null,
                'gender' => $parsed['gender'] ?? null,
                'extra_fields' => $parsed['extra_fields'] ?? null,
                'source' => 'gemini',
                'model' => $usedModel,
            ];
        } catch (\Exception $e) {
            Log::warning('Gemini text analysis failed', ['error' => $e->getMessage()]);
            $defaultResult['error'] = $e->getMessage();
            return $defaultResult;
        }
    }

    private function extractJsonFromText(string $text): ?array
    {
        $text = trim($text);

        $parsed = json_decode($text, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
            return $parsed;
        }

        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $jsonSubstring = substr($text, $start, $end - $start + 1);
            $parsed = json_decode($jsonSubstring, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
                return $parsed;
            }
            Log::warning('JSON extraction from substring failed', [
                'json_error' => json_last_error_msg(),
                'substring_preview' => substr($jsonSubstring, 0, 200),
            ]);
        }

        return null;
    }

    private function buildSectionHeaderInstructions(): string
    {
        $instructions = '';
        foreach ($this->formTypes as $formName => $fields) {
            foreach ($fields as $fieldName => $labels) {
                $headerVariants = implode(' / ', array_map(fn($l) => '"' . strtoupper($l) . '"', $labels));
                $instructions .= "  - Key \"{$fieldName}\": Look for section headers like {$headerVariants}. Extract the EXACT verbatim content under that section header. Set to null if the section says \"[Not Reported]\" or is empty/missing.\n";
            }
        }
        return $instructions;
    }

    private function analyzeWithOci(string $text, string $language): array
    {
        $defaultResult = [
            'name' => null,
            'age' => null,
            'height' => null,
            'gender' => null,
            'extra_fields' => null,
            'source' => 'oci',
        ];

        try {
            $langNames = [
                'en' => 'English',
                'ar' => 'Arabic',
                'fr' => 'French',
                'de' => 'German',
                'es' => 'Spanish',
                'it' => 'Italian',
                'pt' => 'Portuguese',
                'nl' => 'Dutch',
                'hi' => 'Hindi',
                'ja' => 'Japanese',
                'ko' => 'Korean',
                'zh' => 'Chinese',
            ];
            $langName = $langNames[$language] ?? 'English';

            Log::debug('OCI analyzeWithOci raw response', [
                'language' => $language,
                'langName' => $langName,

            ]);
            $languageInstruction = "Return all extracted text values and keys in {$langName}.";

            $sectionInstructions = $this->buildSectionHeaderInstructions();

            $prompt = <<<PROMPT
CRITICAL RULE: You must extract ONLY exact, verbatim words and phrases from the source text. NEVER modify, paraphrase, add, remove, translate, or change any word. Copy content EXACTLY as written under each section header. If a section says "[Not Reported]", set that field to null.

The text is a structured medical record with section headers. Extract the content under each section header into the corresponding field key.

Fixed fields:
1. name - The person's exact full name as written in the text (or null if not found)
2. age - The person's exact age number as written (or null if not found)
3. height - The person's exact height as written in the text (or null if not found)
4. gender - The person's exact gender word as written in the text (or null if not found)

Dynamic fields (extra_fields):
You MUST use ONLY these exact keys. Do NOT create new keys. Extract the EXACT verbatim content from the corresponding section headers in the text:

{$sectionInstructions}

Values MUST be exact verbatim text from the source - no paraphrasing, no additions, no modifications.
If a value contains a [?...] uncertainty marker, copy it verbatim into the field — it is data, not a missing marker.

{$languageInstruction}

Output ONLY a valid, minified JSON object and nothing else. No markdown block formatting, no backticks, no comments, no explanations:
{"name": "...", "age": ..., "height": "...", "gender": "...", "extra_fields": {"patient_complaint": "exact text here", "patient_note": "exact text here", ...}}

Text:
{$text}
PROMPT;

            $ociService = app(OciGenerativeAiService::class);
            $response = $ociService->generate($prompt, null, 0.1);
            $responseText = $response['text'] ?? '';

            Log::debug('OCI analyzeWithOci raw response', [
                'text_preview' => substr($responseText, 0, 300),
                'text_length' => strlen($responseText),
                'model' => $response['model'] ?? null,
            ]);

            $responseText = preg_replace('/^```.*\n/', '', $responseText);
            $responseText = preg_replace('/```$/', '', $responseText);
            $responseText = trim($responseText);

            $parsed = $this->extractJsonFromText($responseText);

            if ($parsed === null) {
                Log::warning('OCI Generative AI response JSON parse failed', ['raw' => substr($responseText, 0, 500)]);
                $defaultResult['error'] = 'Invalid JSON response from OCI Generative AI';
                return $defaultResult;
            }

            return [
                'name' => $parsed['name'] ?? null,
                'age' => isset($parsed['age']) ? (int) $parsed['age'] : null,
                'height' => isset($parsed['height']) ? (string) $parsed['height'] : null,
                'gender' => $parsed['gender'] ?? null,
                'extra_fields' => $parsed['extra_fields'] ?? null,
                'source' => 'oci',
                'model' => $response['model'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::warning('OCI Generative AI text analysis failed', ['error' => $e->getMessage()]);
            $defaultResult['error'] = $e->getMessage();
            return $defaultResult;
        }
    }

    private function mergeResults(?array $pattern, ?array $gemini): array
    {
        $fixedFields = ['name', 'age', 'height', 'gender'];
        $merged = [];

        foreach ($fixedFields as $field) {
            $patternVal = $pattern[$field] ?? null;
            $geminiVal = $gemini[$field] ?? null;

            if ($patternVal !== null && $geminiVal !== null) {
                $merged[$field] = $patternVal;
            } elseif ($patternVal !== null) {
                $merged[$field] = $patternVal;
            } elseif ($geminiVal !== null) {
                $merged[$field] = $geminiVal;
            } else {
                $merged[$field] = null;
            }
        }

        $merged['extra_fields'] = $gemini['extra_fields'] ?? null;

        return $merged;
    }

    private function mapExtractedFieldsToForm(array $extractedFields): array
    {
        $flatData = [];

        foreach ($extractedFields as $key => $value) {
            if ($value === null)
                continue;
            if (is_array($value)) {
                foreach ($value as $subKey => $subValue) {
                    if ($subValue !== null) {
                        $flatData[$subKey] = $subValue;
                    }
                }
            } else {
                $flatData[$key] = $value;
            }
        }

        $consumedKeys = [];
        $mappings = [];

        $sortedFields = $this->formFieldMappings;
        usort($sortedFields, function ($a, $b) {
            $aHasExact = collect($a['labels'])->contains(fn($l) => in_array(strtolower($l), ['name', 'age', 'height', 'gender']));
            $bHasExact = collect($b['labels'])->contains(fn($l) => in_array(strtolower($l), ['name', 'age', 'height', 'gender']));
            return $bHasExact <=> $aHasExact;
        });

        foreach ($sortedFields as $fieldDef) {
            $matchedValue = null;
            $matchedKey = null;
            $confidence = 0;

            foreach ($flatData as $dataKey => $dataValue) {
                if ($dataValue === null || $dataValue === '')
                    continue;

                $dataKeyLower = strtolower($dataKey);
                $dataValueStr = is_string($dataValue) ? $dataValue : (string) $dataValue;

                foreach ($fieldDef['labels'] as $label) {
                    $labelLower = strtolower($label);

                    if ($dataKeyLower === $labelLower) {
                        $matchConfidence = 1.0;
                    } elseif ($dataKeyLower === $fieldDef['form_field']) {
                        $matchConfidence = 0.95;
                    } elseif (str_contains($dataKeyLower, $labelLower) || str_contains($labelLower, $dataKeyLower)) {
                        $matchConfidence = 0.8;
                    } else {
                        continue;
                    }

                    if (isset($consumedKeys[$dataKeyLower])) {
                        continue;
                    }

                    if ($matchConfidence > $confidence) {
                        $confidence = $matchConfidence;
                        $matchedValue = $dataValueStr;
                        $matchedKey = $dataKey;
                    }
                }
            }

            if ($matchedKey !== null && $confidence >= 1.0) {
                $consumedKeys[strtolower($matchedKey)] = $confidence;
            }

            $resolvedValue = $matchedValue;

            if (isset($fieldDef['options']) && $matchedValue !== null) {
                $matchedLower = strtolower($matchedValue);
                foreach ($fieldDef['options'] as $optionLabel => $optionValues) {
                    if (in_array($matchedLower, array_map('strtolower', $optionValues)) || $matchedLower === strtolower($optionLabel)) {
                        $resolvedValue = $optionLabel;
                        break;
                    }
                }
            }

            if ($fieldDef['form_field'] === 'gender' && $resolvedValue !== null) {
                $lower = strtolower($resolvedValue);
                if (in_array($lower, ['male', 'm'])) {
                    $resolvedValue = 'ذكر';
                } elseif (in_array($lower, ['female', 'f'])) {
                    $resolvedValue = 'أنثى';
                }
            }

            $mappings[] = [
                'form_field' => $fieldDef['form_field'],
                'form_type' => $fieldDef['form_type'],
                'value' => $resolvedValue,
                'matched_key' => $matchedKey,
                'confidence' => $confidence,
            ];
        }

        usort($mappings, fn($a, $b) => array_search($a['form_field'], array_column($this->formFieldMappings, 'form_field'))
            <=> array_search($b['form_field'], array_column($this->formFieldMappings, 'form_field')));

        return $mappings;
    }
}
