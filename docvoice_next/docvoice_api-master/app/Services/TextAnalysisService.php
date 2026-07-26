<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\InboxNote;
use App\Models\NoteAnalysis;
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
            'txt_SignificantSign' => ['Important patient notes', 'important_patient_notes', 'key patient notes', 'critical patient notes', 'Patient alerts', 'patient_alerts', 'txt_SignificantSign'],
            'txt_OtherConditions' => ['Other conditions', 'other_conditions', 'additional conditions', 'comorbidities', 'txt_OtherConditions'],
            'txt_RecordOfTreatment' => ['Record of treatment', 'record_of_treatment', 'treatment record', 'treatment log', 'txt_RecordOfTreatment'],
            'txt_Diagnosis' => ['Diagnosis', 'diagnosis', 'clinical diagnosis', 'assessment', 'txt_Diagnosis'],
            'DiagnosisSelect2' => ['Diagnosis select', 'DiagnosisSelect2', 'diagnosis select', 'diagnosis dropdown', 'Type of illness', 'type_of_illness'],
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

    /**
     * Derive form-field extractions from an already-generated envelope,
     * verify them against the raw ASR (safety net), and persist them as a
     * NoteAnalysis row so the extension's injection preview + field-review
     * banner have data to render.
     *
     * Called by InboxNoteController::applyMacro right after the display note
     * is generated — same envelope, no extra LLM call. This replaces the old
     * background-macro-85 field-extraction path entirely.
     */
    public function saveInjectionAnalysis(
        InboxNote $note,
        array $envelopeFields,
        ?array $patientInfo,
        string $rawText
    ): array {
        $extractedFields = $this->deriveExtractedFieldsFromEnvelope($envelopeFields, $patientInfo);
        $fieldMappings = $this->mapExtractedFieldsToForm($extractedFields);

        // Deterministic safety net: the extracted fields go straight into the
        // external patient form with no human review, so they get the same
        // verification the display note gets — compared against the RAW ASR.
        $review = $this->reviewExtractedFields($rawText, $extractedFields);

        $result = [
            'extracted_fields' => $extractedFields,
            'field_mappings' => $fieldMappings,
            'method' => 'oci',
            'language' => 'en',
            'review' => $review,
        ];

        foreach ($this->formTypes as $formName => $fields) {
            $filteredResult = $this->filterResultForForm($result, $formName);
            $filteredResult['review'] = $result['review'];
            $this->saveAnalysis($note, $filteredResult, $formName);
        }

        return $result;
    }

    public function generateNoteFromMacro(InboxNote $note, \App\Models\Macro $macro, string $mode = 'fast'): array
    {
        $text = $note->raw_text ?? $note->original_text ?? $note->formatted_text ?? '';

        if (!$macro->is_ai_macro) {
            $content = $macro->content ?? '';
            $content = str_replace('{{patient_name}}', $note->patient_name ?? '', $content);
            $content = str_replace('{{summary}}', $note->summary ?? '', $content);
            return ['content' => $content];
        }

        if (empty(trim($text))) {
            return ['error' => 'Note has no text content to process'];
        }

        $instruction = $macro->ai_instruction ?? $macro->content ?? '';

        // ── FAST PATH (default) — single OCI call, structured extraction ──
        // One call repairs ASR errors AND emits the NABD fields directly, then
        // the same four deterministic safety nets run on the result. ~3x faster
        // than the precise two-stage path. If it fails for any reason we fall
        // through to the precise path below, so the doctor still gets a note.
        if ($mode === 'fast') {
            $fast = $this->runFastExtraction($text, $note);
            if (!isset($fast['error']) && !empty($fast['envelope_fields'])) {
                return $fast;
            }
            Log::warning('Fast path failed — falling back to precise path', [
                'error' => $fast['error'] ?? 'no fields',
            ]);
        }

        // ── Two-stage golden path — ORACLE OCI ONLY ──
        // Stage 1 (Repair): run once per note, cached on the DB row.
        // Stage 2 (Format): run per template, working from the cached repaired
        // transcript.
        // Data sovereignty policy: NO third-party AI providers (Gemini, Groq,
        // OpenAI, etc.) may be used. If OCI fails, the doctor sees a clear
        // error — never a silent fallback that leaks PHI to another vendor.
        $repair = $this->getOrCreateRepair($note, $text);
        if (isset($repair['error'])) {
            return ['error' => 'Repair stage failed: ' . $repair['error']];
        }

        $format = $this->runFormatStage($repair['repaired_transcript'], $instruction);

        // If Stage 2 fails, one Oracle-only retry via the unified prompt as a
        // last resort — same provider, different prompt shape.
        if (isset($format['error']) || empty($format['fields']) || !is_array($format['fields'])) {
            Log::warning('Stage 2 format failed — trying Oracle unified prompt', [
                'stage2_error' => $format['error'] ?? 'no fields',
            ]);
            return $this->generateContentWithOci($text, $instruction);
        }

        return $this->buildNoteFromParts(
            $format['fields'],
            $repair['repaired_transcript'],
            $repair['flags'] ?? [],
            $repair['patient_info'] ?? null,
            $text,
            $format['source'],
            $format['model'] ?? null
        );
    }

    /**
     * Stage 1 (Repair) — idempotent per note. Returns the cached repair
     * if the note already has one; otherwise runs OCI and persists the result.
     * Oracle-only per data sovereignty policy — no third-party failover.
     */
    private function getOrCreateRepair(InboxNote $note, string $rawText): array
    {
        if (!empty($note->repaired_transcript)) {
            return [
                'repaired_transcript' => (string) $note->repaired_transcript,
                'flags' => is_array($note->repair_flags) ? $note->repair_flags : [],
                'patient_info' => is_array($note->repair_patient_info) ? $note->repair_patient_info : null,
                'source' => 'cached',
            ];
        }

        $repair = $this->runRepairWithOci($rawText);
        if (isset($repair['error'])) {
            return $repair;
        }

        try {
            $note->repaired_transcript = $repair['repaired_transcript'];
            $note->repair_flags = $repair['flags'];
            $note->repair_patient_info = $repair['patient_info'];
            $note->save();
        } catch (\Exception $e) {
            Log::warning('Failed to persist repair cache', [
                'error' => $e->getMessage(),
                'note_id' => $note->id,
            ]);
        }

        return $repair;
    }

    private function runRepairWithOci(string $rawText): array
    {
        try {
            $prompt = \App\Constants\AIPromptConstants::MASTER_REPAIR_ONLY_PROMPT;
            $prompt = str_replace('{{RAW_TEXT_FROM_WHISPER}}', $rawText, $prompt);
            $ociService = app(OciGenerativeAiService::class);
            $response = $ociService->generate($prompt, null, 0.1, 2000);
            return $this->parseRepairResponse($response['text'] ?? '', 'oci', $response['model'] ?? null);
        } catch (\Exception $e) {
            Log::error('OCI repair exception', ['error' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }

    private function parseRepairResponse(string $responseText, string $source, ?string $model): array
    {
        $clean = preg_replace('/^```[a-zA-Z]*\n?/', '', trim($responseText));
        $clean = preg_replace('/```$/', '', $clean);
        $env = $this->extractJsonFromText(trim($clean));

        if (!is_array($env) || !isset($env['repaired_transcript'])) {
            Log::warning('Repair envelope missing repaired_transcript key', [
                'source' => $source,
                'preview' => mb_substr((string) $clean, 0, 200),
            ]);
            return ['error' => 'Malformed repair envelope'];
        }

        return [
            'repaired_transcript' => (string) $env['repaired_transcript'],
            'flags' => (isset($env['flags']) && is_array($env['flags'])) ? $env['flags'] : [],
            'patient_info' => (isset($env['patient_info']) && is_array($env['patient_info'])) ? $env['patient_info'] : null,
            'source' => $source,
            'model' => $model,
        ];
    }

    /**
     * Stage 2 (Format) — Oracle OCI only. Data sovereignty policy prohibits
     * third-party AI providers as failover.
     */
    private function runFormatStage(string $repairedText, string $instruction): array
    {
        try {
            $prompt = \App\Constants\AIPromptConstants::MASTER_FORMAT_ONLY_PROMPT;
            $prompt = str_replace('{{SELECTED_TEMPLATE_NAME}}', $instruction, $prompt);
            $prompt = str_replace('{{REPAIRED_TRANSCRIPT}}', $repairedText, $prompt);
            $ociService = app(OciGenerativeAiService::class);
            $response = $ociService->generate($prompt, null, 0.2, 2500);
            return $this->parseFormatResponse($response['text'] ?? '', 'oci', $response['model'] ?? null);
        } catch (\Exception $e) {
            Log::error('OCI format exception', ['error' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }

    private function parseFormatResponse(string $responseText, string $source, ?string $model): array
    {
        $clean = preg_replace('/^```[a-zA-Z]*\n?/', '', trim($responseText));
        $clean = preg_replace('/```$/', '', $clean);
        $env = $this->extractJsonFromText(trim($clean));

        if (!is_array($env) || !isset($env['fields']) || !is_array($env['fields'])) {
            Log::warning('Format envelope missing fields key', [
                'source' => $source,
                'preview' => mb_substr((string) $clean, 0, 200),
            ]);
            return ['error' => 'Malformed format envelope'];
        }

        return [
            'fields' => $env['fields'],
            'source' => $source,
            'model' => $model,
        ];
    }

    /**
     * Compose the doctor-facing note + review from Stage 2 fields and
     * Stage 1 context (already fetched from cache or freshly computed).
     * This method NEVER inspects a JSON envelope — the caller passed
     * fields directly, so there is no envelope_malformed path here. This
     * is precisely the fragility that broke the previous split attempt.
     */
    private function buildNoteFromParts(
        array $fields,
        string $repairedText,
        array $flags,
        ?array $patientInfo,
        string $rawText,
        string $source,
        ?string $model
    ): array {
        $content = $this->renderFieldsToNote($fields);

        $patientAge = null;
        if (isset($patientInfo['age']) && is_numeric($patientInfo['age'])) {
            $patientAge = (string) (int) $patientInfo['age'];
        }

        // Same four safety nets as the unified path — they take fields
        // and raw text, not the envelope, so wiring them here is direct.
        $review = $this->reconcileNumbers(
            $repairedText !== '' ? $repairedText : $rawText,
            $content,
            $patientAge
        );

        $entityReview = $this->reconcileEntities($rawText, $fields);
        $review['unverified_entities'] = $entityReview['unverified_entities'];
        $review['passed'] = $review['passed'] && empty($entityReview['unverified_entities']);

        $termReview = $this->reconcileCriticalTerms($rawText, $fields);
        $review['unverified_terms'] = $termReview['unverified_terms'];
        $review['passed'] = $review['passed'] && empty($termReview['unverified_terms']);

        $polarityReview = $this->reconcilePolarity($rawText, $fields);
        $review['polarity_flags'] = $polarityReview['polarity_flags'];
        $review['passed'] = $review['passed'] && empty($polarityReview['polarity_flags']);

        $unverified = array_merge(
            $entityReview['unverified_entities'] ?? [],
            $termReview['unverified_terms'] ?? []
        );
        if (!empty($unverified)) {
            $content = $this->markUnverifiedInContent($content, $unverified);
        }

        return [
            'content' => $content,
            'source' => $source,
            'model' => $model,
            'repaired_transcript' => $repairedText,
            'flags' => $flags,
            'review' => $review,
            'envelope_fields' => $fields,
            'patient_info' => $patientInfo,
        ];
    }

    /**
     * FAST PATH — one OCI call that repairs the ASR text and emits the NABD
     * form fields in a single structured JSON envelope. No separate repair /
     * format / injection calls, so it is markedly faster than the precise
     * two-stage path. The deterministic safety nets still run afterwards.
     * Oracle-only per data sovereignty policy.
     */
    private function runFastExtraction(string $rawText, ?InboxNote $note = null): array
    {
        try {
            $prompt = \App\Constants\AIPromptConstants::FAST_EXTRACTION_PROMPT;
            $specialtyRule = '';
            if ($note && !empty($note->doctor_specialty)) {
                $specialtyRule = 'CONTEXT: the dictating physician specialises in "' . $note->doctor_specialty . '" — use this to disambiguate acronyms and phonetic errors.';
            }
            $prompt = str_replace('{{DOCTOR_SPECIALTY}}', $specialtyRule, $prompt);
            $prompt = str_replace('{{RAW}}', $rawText, $prompt);

            $ociService = app(OciGenerativeAiService::class);
            // temp 0.1 for determinism; 2000 tokens is ample for one field set.
            $response = $ociService->generate($prompt, null, 0.1, 2000);
            return $this->buildNoteFromFastEnvelope($response['text'] ?? '', $rawText, 'oci-fast', $response['model'] ?? null);
        } catch (\Exception $e) {
            Log::error('OCI fast extraction exception', ['error' => $e->getMessage()]);
            return ['error' => 'An error occurred while generating content: ' . $e->getMessage()];
        }
    }

    /**
     * Parse the fast-path envelope, coerce the field values to strings, map the
     * clinical_reasoning buffer onto the same review/flags shape the precise
     * path uses, then render + run the four deterministic safety nets by
     * delegating to buildNoteFromParts. Returns the identical output contract
     * so the controller and extension treat both paths the same.
     */
    private function buildNoteFromFastEnvelope(
        string $responseText,
        string $rawText,
        string $source,
        ?string $model
    ): array {
        $clean = preg_replace('/^```[a-zA-Z]*\n?/', '', trim($responseText));
        $clean = preg_replace('/```$/', '', $clean);
        $envelope = $this->extractJsonFromText(trim($clean));

        if ($envelope === null) {
            Log::warning('Fast envelope not parseable as JSON', [
                'preview' => mb_substr($clean, 0, 200),
            ]);
            return ['error' => 'Fast extraction returned malformed JSON'];
        }

        // Every top-level key except the audit + reasoning buffers + patient_info
        // is a form field. Coerce all values to strings for renderFieldsToNote.
        // New magic-path schema puts corrections/retractions/flags at the top
        // level; legacy schema wraps them in clinical_reasoning — both stay
        // reserved so neither ever spills into the note as prose.
        $reserved = ['clinical_reasoning', 'patient_info', 'corrections', 'retractions', 'flags'];
        $fields = [];
        foreach ($envelope as $key => $value) {
            if (in_array($key, $reserved, true)) {
                continue;
            }
            if (is_array($value)) {
                $value = implode(', ', array_filter(array_map('strval', $value), fn($v) => trim($v) !== ''));
            }
            $fields[$key] = (string) $value;
        }

        if (empty($fields)) {
            return ['error' => 'Fast extraction produced no fields'];
        }

        // NEW MAGIC-PATH SCHEMA: corrections/retractions/flags live at top level
        // with a class field per correction. Legacy clinical_reasoning wrapper
        // is still accepted so a mid-deploy model that emits the old shape
        // does not break — read from wherever they land.
        $correctionsRaw = [];
        $flagsRaw = [];
        $retractionsRaw = [];
        if (is_array($envelope['corrections'] ?? null)) {
            $correctionsRaw = $envelope['corrections'];
        }
        if (is_array($envelope['flags'] ?? null)) {
            $flagsRaw = $envelope['flags'];
        }
        if (is_array($envelope['retractions'] ?? null)) {
            $retractionsRaw = $envelope['retractions'];
        }
        $cr = is_array($envelope['clinical_reasoning'] ?? null) ? $envelope['clinical_reasoning'] : [];
        if (empty($correctionsRaw) && is_array($cr['corrections'] ?? null)) {
            $correctionsRaw = $cr['corrections'];
        }
        if (empty($flagsRaw) && is_array($cr['flags'] ?? null)) {
            $flagsRaw = $cr['flags'];
        }

        // C1 VERBATIM ORIGIN AUDIT — the deterministic guard against the exact
        // failure mode the magic-path prompt is designed to prevent: a
        // fabricated correction ("the obd" -> "COPD" where "the obd" was never
        // spoken). The prompt tells the model to self-check, but a code check
        // the model cannot bypass is the only real guarantee. Every rejected
        // correction becomes an advisory the physician can see, not a silent
        // drop, so the audit trail stays intact.
        $flags = [];
        $advisories = [];
        $rewrittenTerms = [];
        $rawLowerForAudit = mb_strtolower($rawText);
        foreach ($correctionsRaw as $c) {
            if (!is_array($c)) {
                continue;
            }
            $original = trim((string) ($c['original'] ?? ''));
            $corrected = trim((string) ($c['corrected'] ?? ''));
            $class = strtolower((string) ($c['class'] ?? ''));
            $reason = (string) ($c['reason'] ?? '');
            $evidence = trim((string) ($c['evidence'] ?? ''));
            $candidates = is_array($c['candidates'] ?? null) ? $c['candidates'] : [];

            // A3/A4: the model marked the token as ambiguous / unintelligible
            // and left [?original] in the field. Surface as an advisory with
            // the plausible readings so the physician can choose — never emit
            // as a repair-flag (there IS no repair).
            if ($class === 'ambiguous' || $class === 'unintelligible' || $corrected === '' || $corrected === 'null') {
                if ($original !== '') {
                    $cands = array_values(array_filter(array_map('strval', $candidates), fn($v) => trim($v) !== ''));
                    $advisories[] = 'Uncertain token "' . $original . '"'
                        . ($cands ? ' — candidates: ' . implode(', ', $cands) : '')
                        . ($reason !== '' ? ' — ' . $reason : '');
                }
                continue;
            }

            // C1 audit: original MUST appear verbatim (case-insensitive) in RAW.
            // Fabricated corrections are the exact failure the magic-path
            // rewrite targets — drop them and log an advisory so the physician
            // sees the AI tried to invent something and the guard caught it.
            if ($original === '' || mb_strpos($rawLowerForAudit, mb_strtolower($original)) === false) {
                if ($original !== '' && $corrected !== '') {
                    $advisories[] = 'AI proposed correction "' . $original . '" → "' . $corrected . '" was rejected: original text not found in transcript (possible hallucination).';
                }
                continue;
            }

            // PLAUSIBILITY GATE: a correction whose original really was spoken
            // can still be a content rewrite rather than a phonetic repair —
            // C1 cannot see that, this can. Rejected rewrites are surfaced as
            // advisories and their substituted term is amber-marked below.
            $implausible = $this->assessCorrectionPlausibility($original, $corrected);
            if ($implausible !== '') {
                $rewrittenTerms[] = $corrected;
                $advisories[] = 'AI rewrote "' . $original . '" as "' . $corrected . '" — '
                    . $implausible . '. Verify against the dictation.';
                continue;
            }

            $flags[] = [
                'original' => $original,
                'repaired' => $corrected,
                'confidence' => 'high',
                'reason' => $reason . ($evidence !== '' ? ' | evidence: ' . $evidence : ''),
            ];
        }

        // Retractions — physician self-corrections ("scratch that"). Surface
        // as advisories so the physician sees what was cancelled and how it
        // was replaced. The retracted number safely leaves the missing_numbers
        // false-positive category, but only if the model actually logged it.
        foreach ($retractionsRaw as $r) {
            if (!is_array($r)) {
                continue;
            }
            $retracted = trim((string) ($r['retracted'] ?? ''));
            $replacement = isset($r['replacement']) && $r['replacement'] !== null
                ? trim((string) $r['replacement'])
                : '';
            if ($retracted === '') {
                continue;
            }
            $advisories[] = 'Physician retracted: "' . $retracted . '"'
                . ($replacement !== '' ? ' — replaced with: "' . $replacement . '"' : ' (no replacement)');
        }

        // flags[] -> plain strings. command-a sometimes emits {"text":"..."}
        // objects here instead of strings, so normalise both.
        foreach ($flagsRaw as $f) {
            if (is_string($f)) {
                $advisories[] = $f;
            } elseif (is_array($f)) {
                $advisories[] = (string) ($f['text'] ?? reset($f));
            }
        }

        $patientInfo = is_array($envelope['patient_info'] ?? null) ? $envelope['patient_info'] : null;

        // Delegate render + the four deterministic safety nets (numeric,
        // entity, critical-term, polarity). No repaired transcript in the fast
        // path, so pass '' — buildNoteFromParts reconciles against raw text.
        $result = $this->buildNoteFromParts($fields, '', $flags, $patientInfo, $rawText, $source, $model);

        // Post-process the review to suppress false positives that the
        // magic-path envelope already accounts for:
        //  (1) retracted numbers ("wait, scratch that 2015") — the model
        //      logged them as retractions, so they are NOT missing data.
        //  (2) accepted corrections' corrected terms — if the model said
        //      "trope oh nin" → "troponin" and C1 accepted it, the corrected
        //      form (troponin) does not need re-verification against raw.
        if (isset($result['review']) && is_array($result['review'])) {
            // A correction the plausibility gate rejected is a content rewrite
            // the model performed anyway — the substituted term is already
            // sitting in the rendered note. Amber-mark it in place (the same
            // channel NoteViewer uses for unverified entities) so the warning
            // appears exactly where the wrong word is, not only in a banner a
            // scanning physician can skip past.
            if (!empty($rewrittenTerms)) {
                $result['content'] = $this->markUnverifiedInContent(
                    (string) ($result['content'] ?? ''),
                    $rewrittenTerms
                );
                $result['review']['unverified_terms'] = array_values(array_unique(array_merge(
                    $result['review']['unverified_terms'] ?? [],
                    $rewrittenTerms
                )));
            }

            if (!empty($retractionsRaw) && !empty($result['review']['missing_numbers'] ?? [])) {
                $retractedNumbers = [];
                foreach ($retractionsRaw as $r) {
                    if (!is_array($r)) continue;
                    $retracted = (string) ($r['retracted'] ?? '');
                    if (preg_match_all('/\d+(?:\.\d+)?/', $retracted, $nm)) {
                        foreach ($nm[0] as $n) {
                            $retractedNumbers[$n] = true;
                        }
                    }
                }
                if (!empty($retractedNumbers)) {
                    $result['review']['missing_numbers'] = array_values(array_filter(
                        $result['review']['missing_numbers'],
                        fn($n) => !isset($retractedNumbers[(string) $n])
                    ));
                }
            }
            if (!empty($flags) && !empty($result['review']['unverified_terms'] ?? [])) {
                $acceptedCorrectedLower = [];
                foreach ($flags as $f) {
                    $rep = mb_strtolower(trim((string) ($f['repaired'] ?? '')));
                    if ($rep !== '') {
                        // Every 4+ char word inside the corrected value is
                        // considered dictated (via the audited correction).
                        preg_match_all('/[a-z]{4,}/u', $rep, $wm);
                        foreach ($wm[0] ?? [] as $w) {
                            $acceptedCorrectedLower[$w] = true;
                        }
                    }
                }
                if (!empty($acceptedCorrectedLower)) {
                    $result['review']['unverified_terms'] = array_values(array_filter(
                        $result['review']['unverified_terms'],
                        fn($term) => !isset($acceptedCorrectedLower[mb_strtolower((string) $term)])
                    ));
                }
            }
            // Re-derive passed after the two filters above.
            $result['review']['passed'] = empty($result['review']['missing_numbers'])
                && empty($result['review']['suspicious_ranges'] ?? [])
                && empty($result['review']['unverified_entities'] ?? [])
                && empty($result['review']['unverified_terms'])
                && empty($result['review']['polarity_flags'] ?? []);

            // Final pass: unwrap the model's [?...] on paraphrase words it
            // invented. Must run AFTER the safety nets have amber-marked the
            // real hallucinations so this only touches noise, never a warning
            // the physician actually needs. keepList protects every term any
            // upstream code deliberately amber-marked, so the unwrap can't
            // undo the very signals the pipeline exists to raise.
            $keepList = array_merge(
                $result['review']['unverified_terms'] ?? [],
                $result['review']['unverified_entities'] ?? [],
                $rewrittenTerms
            );
            $result['content'] = $this->unwrapModelInventedUncertainty(
                (string) ($result['content'] ?? ''),
                $rawText,
                $keepList
            );
        }

        // Surface the model's own discrepancy notes alongside the deterministic
        // review so the extension can show them on the review banner.
        if (!empty($advisories)) {
            $result['review']['ai_advisories'] = $advisories;
        }

        return $result;
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
            //
            // One automatic retry if the model returns prose instead of the JSON
            // envelope: a second pass usually returns valid JSON, sparing the
            // physician a note that skipped all the deterministic safety nets.
            $result = null;
            for ($attempt = 1; $attempt <= 2; $attempt++) {
                $response = $ociService->generate($prompt, null, 0.2, 3000);
                $responseText = $response['text'] ?? '';
                $result = $this->buildNoteFromEnvelope($responseText, $text, 'oci', $response['model'] ?? null);

                if (empty($result['envelope_malformed'])) {
                    return $result;
                }

                Log::warning("OCI repair/format envelope malformed on attempt {$attempt} of 2");
            }

            // Both attempts malformed: return the last result. It is now marked
            // review.passed = false so the review banner warns the physician
            // that the note bypassed verification (see buildNoteFromEnvelope).
            return $result;
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
    private function buildNoteFromEnvelope(
        string $responseText,
        string $rawText,
        string $source,
        ?string $model
    ): array {
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
                'envelope_fields' => null,
                'patient_info' => null,
                // Signals the caller to retry (OCI path) and, if the retry also
                // fails, keeps this note flagged rather than silently trusted.
                'envelope_malformed' => true,
                // passed = false so the review banner surfaces to the physician:
                // this note skipped every deterministic safety net because the
                // model did not return the structured envelope we verify against.
                'review' => ['passed' => false, 'missing_numbers' => [], 'suspicious_ranges' => [], 'unverified' => true],
            ];
        }

        $repaired = isset($envelope['repaired_transcript']) ? (string) $envelope['repaired_transcript'] : '';
        $flags = (isset($envelope['flags']) && is_array($envelope['flags'])) ? $envelope['flags'] : [];
        $content = $this->renderFieldsToNote($envelope['fields']);

        // Templates handle demographics manually (per user policy), so the
        // patient's age from patient_info is a demographic marker, not a
        // clinical value the reconciliation should track. Pass it in so
        // reconcileNumbers excludes it explicitly — a structured value from
        // patient_info is far more reliable than the regex heuristic that
        // only catches "N year old" and misses "aged N", "Age: N", etc.
        $patientAge = null;
        if (isset($envelope['patient_info']['age']) && is_numeric($envelope['patient_info']['age'])) {
            $patientAge = (string) (int) $envelope['patient_info']['age'];
        }

        // Deterministic safety net: compare numbers in the repaired transcript
        // against the rendered note. The AI cannot suppress this check.
        $review = $this->reconcileNumbers(
            $repaired !== '' ? $repaired : $rawText,
            $content,
            $patientAge
        );

        // Second deterministic safety net: verify every clinical acronym in
        // the output actually appears in the RAW ASR transcript — the only
        // ground truth of what the doctor said. Comparing against
        // repaired_transcript let a mistake through when the model wrote the
        // substitution (e.g. "BNP" for "troponins") in both the repair and
        // format stages: the self-consistency check saw agreement and passed
        // silently. The raw transcript cannot be rewritten by the model.
        $entityReview = $this->reconcileEntities($rawText, $envelope['fields']);
        $review['unverified_entities'] = $entityReview['unverified_entities'];
        $review['passed'] = $review['passed'] && empty($entityReview['unverified_entities']);

        // Third deterministic safety net: phonetic verification of long
        // lowercase terms in critical fields (drug names, lab tests). Catches
        // silent substitutions the acronym check cannot see — e.g. the AI
        // writing "procalcitonin" when the doctor said something that Oracle
        // transcribed as "proponents" (actual dictation: "troponins").
        $termReview = $this->reconcileCriticalTerms($rawText, $envelope['fields']);
        $review['unverified_terms'] = $termReview['unverified_terms'];
        $review['passed'] = $review['passed'] && empty($termReview['unverified_terms']);

        // Fourth deterministic safety net: polarity reversal. Catches cases where
        // the AI writes the OPPOSITE of what the doctor said (e.g. doctor: "denies
        // chest pain" → AI writes "chest pain present"). Purely lexical: compares
        // negation-word context around every anchor term shared between raw ASR
        // and the field, no LLM call. See reconcilePolarity() for the algorithm.
        $polarityReview = $this->reconcilePolarity($rawText, $envelope['fields']);
        $review['polarity_flags'] = $polarityReview['polarity_flags'];
        $review['passed'] = $review['passed'] && empty($polarityReview['polarity_flags']);

        // Amber highlight the flagged tokens INSIDE the note itself, not just
        // in the sidebar banner. NoteViewer already renders [?...] in amber
        // with a "verify" tooltip — reusing that visual channel means the
        // doctor sees the warning exactly where the wrong word is, so a
        // scanned note can't hide the substitution the way a banner can.
        $unverified = array_merge(
            $entityReview['unverified_entities'] ?? [],
            $termReview['unverified_terms'] ?? []
        );
        if (!empty($unverified)) {
            $content = $this->markUnverifiedInContent($content, $unverified);
        }

        $patientInfo = (isset($envelope['patient_info']) && is_array($envelope['patient_info']))
            ? $envelope['patient_info']
            : null;

        return [
            'content' => $content,
            'source' => $source,
            'model' => $model,
            'repaired_transcript' => $repaired,
            'flags' => $flags,
            'review' => $review,
            // Raw section fields and patient demographics from the envelope,
            // used by saveInjectionAnalysis to derive extracted_fields from the
            // same envelope — no second AI extraction call.
            'envelope_fields' => $envelope['fields'],
            'patient_info' => $patientInfo,
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
     * Best-effort JSON extraction from the model response: first try a
     * straight decode of the whole string, then fall back to the widest
     * {...} substring. Returns null if neither yields a valid array.
     */
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

    /**
     * Wrap each unverified token in the note content with [?...] so
     * NoteViewer's amber highlighter draws attention to it in the note
     * body, not only in the sidebar review banner. Skips tokens already
     * inside an existing [?...] wrapper (idempotent) and only touches
     * whole-word case-insensitive matches (never mid-word). Order matters:
     * we sort by length descending so a longer term wins over a substring
     * of it (e.g. "levofloxacin" before "levo").
     */
    /**
     * Deterministic plausibility gate for a single ASR correction.
     *
     * The magic-path prompt asks the model to repair only PHONETIC garble and
     * never to rewrite content it disagrees with clinically. Live testing
     * showed it still crosses that line: it rewrote "Brad bradycardia" — which
     * the physician was explicitly quoting from the triage chart — as
     * "tachycardia" because HR 110 is tachycardic, and turned the truncated
     * word "drop" into "cath lab". Both are content edits dressed as
     * transcription repairs, and both are invisible to the C1 verbatim-origin
     * audit because the original text really was spoken.
     *
     * Three independent layers, any of which rejects the correction:
     *   1. DIGIT MUTATION — digits must survive a phonetic repair untouched.
     *      "V22" -> "V2-V4" and "100 OA" -> "100/60" both fail here. This
     *      extends numeric integrity (B2) to the corrections channel.
     *   2. CLINICAL ANTONYM SWAP — the two sides sit on opposite ends of a
     *      known clinical opposition (brady/tachy, hypo/hyper, left/right).
     *      No phonetic accident produces an antonym, so this is always a
     *      content edit. This catches the bradycardia case, which NO phonetic
     *      metric can separate from a legitimate repair: it scores 61.5%
     *      character similarity, above the genuine repair "night rope ills"
     *      -> "nitroglycerin pills" at 64.5%.
     *   3. PHONETIC IMPLAUSIBILITY — a character-similarity measure and a
     *      metaphone-distance measure must BOTH agree the two are unrelated
     *      sounds. Thresholds calibrated against 16 real repairs and 9 real
     *      rewrites taken from live dictations. Requiring both to fire keeps
     *      metaphone's known weakness on short garbled tokens (e.g. "akj" ->
     *      "EKG", distance 0.67) from causing a false rejection.
     *
     * Layers 1 and 2 are exact; layer 3 is calibrated and deliberately
     * conservative — it is far better to let a questionable repair through to
     * the amber review channel than to reject a correct one silently.
     *
     * @return string Empty when plausible, otherwise the rejection reason.
     */
    private function assessCorrectionPlausibility(string $original, string $corrected): string
    {
        // ── Layer 1: the digits must be identical on both sides ──
        $digitsOf = static function (string $s): string {
            preg_match_all('/\d+/', $s, $m);
            $digits = $m[0] ?? [];
            sort($digits);
            return implode(',', $digits);
        };
        if ($digitsOf($original) !== $digitsOf($corrected)) {
            return 'numeric value changed by the correction';
        }

        $loOriginal = mb_strtolower($original);
        $loCorrected = mb_strtolower($corrected);

        // ── Layer 2: clinical antonym / laterality swap ──
        // Direction-agnostic: A->B and B->A are both rejected. The guard
        // requires one side to carry A-and-not-B while the other carries
        // B-and-not-A, so a term containing both (or neither) is untouched.
        static $antonymPairs = [
            ['brady', 'tachy'],
            ['hypo', 'hyper'],
            ['left', 'right'],
            ['increase', 'decrease'],
            ['elevated', 'depressed'],
            ['positive', 'negative'],
            ['present', 'absent'],
            ['normal', 'abnormal'],
            ['regular', 'irregular'],
            ['improved', 'worsened'],
            ['afebrile', 'febrile'],
            ['systolic', 'diastolic'],
        ];
        foreach ($antonymPairs as [$termA, $termB]) {
            $originalHasA = str_contains($loOriginal, $termA);
            $originalHasB = str_contains($loOriginal, $termB);
            $correctedHasA = str_contains($loCorrected, $termA);
            $correctedHasB = str_contains($loCorrected, $termB);

            $flipsAtoB = $originalHasA && !$originalHasB && $correctedHasB && !$correctedHasA;
            $flipsBtoA = $originalHasB && !$originalHasA && $correctedHasA && !$correctedHasB;

            if ($flipsAtoB || $flipsBtoA) {
                return "clinical opposite ('{$termA}' vs '{$termB}') — a content edit, not a phonetic repair";
            }
        }

        // ── Layer 3: phonetic implausibility (both measures must agree) ──
        $normalise = static fn (string $s): string => preg_replace('/[^a-z0-9]/', '', mb_strtolower($s));
        $normOriginal = $normalise($original);
        $normCorrected = $normalise($corrected);
        if ($normOriginal === '' || $normCorrected === '') {
            return '';
        }

        $similarity = 0.0;
        similar_text($normOriginal, $normCorrected, $similarity);

        $metaphoneOf = static function (string $s): string {
            $code = '';
            foreach (preg_split('/\s+/', trim(mb_strtolower($s))) as $word) {
                $word = preg_replace('/[^a-z]/', '', $word);
                if ($word === '') {
                    continue;
                }
                $wordCode = metaphone($word);
                if ($wordCode !== false) {
                    $code .= $wordCode;
                }
            }
            return $code;
        };
        $metaOriginal = $metaphoneOf($original);
        $metaCorrected = $metaphoneOf($corrected);
        $metaLength = max(strlen($metaOriginal), strlen($metaCorrected));
        $metaDistance = $metaLength > 0
            ? levenshtein($metaOriginal, $metaCorrected) / $metaLength
            : 1.0;

        if ($similarity < 55.0 && $metaDistance > 0.7) {
            return sprintf(
                'phonetically unrelated (%.0f%% character similarity, %.2f metaphone distance)',
                $similarity,
                $metaDistance
            );
        }

        return '';
    }

    /**
     * Strip [?TOKEN] wrappers the model placed around its OWN paraphrase words
     * ("pending", "administered", "arrival") in violation of the [?] SCOPE
     * rule. The marker is meant to point at verbatim transcript text the model
     * could not confidently interpret — so a bracketed token that is neither
     * in the raw ASR nor in a list we deliberately want to keep amber-marked
     * is by definition the model misusing the marker on prose it invented.
     *
     * Two survival tests, either keeps the brackets:
     *   - the enclosed token appears verbatim in RAW (legitimate A3/A4 usage
     *     pointing at the actual dictation), OR
     *   - the enclosed token appears in $keepList (amber deliberately added by
     *     our own safety nets or plausibility gate — never strip our own).
     *
     * Ambiguous or hallucinated content this strips is not silently lost:
     * reconcileCriticalTerms already ran and any true addition is sitting in
     * review.unverified_terms (and therefore also in $keepList and therefore
     * kept). Only benign paraphrase noise ends up unwrapped.
     */
    private function unwrapModelInventedUncertainty(string $content, string $rawText, array $keepList): string
    {
        $rawLower = mb_strtolower($rawText);
        $keepLower = [];
        foreach ($keepList as $entry) {
            $token = trim((string) $entry);
            if ($token !== '') {
                $keepLower[mb_strtolower($token)] = true;
            }
        }

        $result = preg_replace_callback(
            '/\[\?([^\]]+)\]/u',
            static function (array $m) use ($rawLower, $keepLower): string {
                $token = trim($m[1]);
                if ($token === '') {
                    return $m[0];
                }
                $tokenLower = mb_strtolower($token);
                if (isset($keepLower[$tokenLower])) {
                    return $m[0];
                }
                if ($rawLower !== '' && str_contains($rawLower, $tokenLower)) {
                    return $m[0];
                }
                return $token;
            },
            $content
        );

        return $result ?? $content;
    }

    private function markUnverifiedInContent(string $content, array $tokens): string
    {
        $unique = array_values(array_unique(array_filter($tokens, fn($t) => trim((string) $t) !== '')));
        usort($unique, fn($a, $b) => mb_strlen($b) <=> mb_strlen($a));

        foreach ($unique as $token) {
            $quoted = preg_quote($token, '/');
            // Skip if this exact token is already inside a [?...] wrapper.
            // (?<!\[\?) rejects a preceding "[?"; (?![^\[]*\]) rejects a
            // trailing "]" without an intervening "[" (crude but effective
            // for our single-line-per-value note format).
            $pattern = '/(?<!\[\?)\b' . $quoted . '\b(?![^\[]*\])/i';
            $content = preg_replace($pattern, '[?$0]', $content) ?? $content;
        }

        return $content;
    }

    /**
     * Deterministic numeric reconciliation between the source transcript and the
     * generated note. Catches the two silent-failure modes seen in testing:
     *   - dropped numbers  (e.g. RR 26, ACQ 3.5 vanish from the note)
     *   - fabricated ranges (e.g. "88-91%" invented from BP 88 + SpO2 91)
     */
    private function reconcileNumbers(string $source, string $note, ?string $excludeNumber = null): array
    {
        // Atomic tokenizer: extract every standalone number (with optional
        // decimal) as its own token, NEVER treating "a/b" as a single glyph.
        // Rationale: the doctor commonly dictates ratios in prose ("6 out
        // of 10", "152 over 95") and the AI legitimately compacts them to
        // "6/10" and "152/95". A compound-aware regex saw those as ONE
        // token in the note and TWO in the source, producing a chronic
        // false alarm on every pain score and BP reading. Atoms are the
        // stable unit of comparison across dictation styles.
        $tokenPattern = '/\d+(?:\.\d+)?/';

        // Belt-and-braces age handling. The primary defence is the caller
        // passing patient_info.age via $excludeNumber below. This regex
        // family is a fallback for when the LLM did not populate
        // patient_info (e.g. "65 year old" phrased as "aged 65", or the
        // envelope's patient_info block came back null). Order matters:
        // strip demographic markers BEFORE tokenising numbers, so a bare
        // "65" in "65 gentleman" never enters the reconciliation set.
        $agePatterns = [
            // Postfix: "65 year(s) old", "65-year old", "65 y/o", "65 yo"
            '/\b\d{1,3}\b(?=\s*-?\s*(?:years?|yrs?)\s*-?\s*old\b|\s*-?\s*y\/?o\b|\s*-?\s*yo\b)/i',
            // Prefix: "age 65", "aged 65", "age: 65", "age is 65"
            '/(?<=\bage\b|\baged\b)\s*(?:is|:)?\s*\d{1,3}\b/i',
            // Prefix: "N-year-old male", "N year old lady" (variant of above)
            '/\b\d{1,3}\b(?=\s*-?\s*year(?:s)?\s*-?\s*old\s+(?:male|female|man|woman|gentleman|lady))/i',
            // Prefix: "N male/female/man/woman/gentleman/lady" (bare demographic)
            '/\b\d{1,3}\b(?=\s+(?:year[- ]?old\s+)?(?:male|female|man|woman|gentleman|lady|patient)\b)/i',
        ];
        foreach ($agePatterns as $p) {
            $source = preg_replace($p, '', $source);
            $note = preg_replace($p, '', $note);
        }

        preg_match_all($tokenPattern, $source, $sm);
        preg_match_all($tokenPattern, $note, $nm);
        $srcCounts = array_count_values($sm[0] ?? []);
        $noteCounts = array_count_values($nm[0] ?? []);

        // Templates handle demographics manually — the patient's age from
        // patient_info is not a clinical value that must appear in a section.
        // Drop it from BOTH counts so it can't be flagged as "missing" from
        // the note even when it's obviously present in the transcript.
        if ($excludeNumber !== null && $excludeNumber !== '') {
            unset($srcCounts[$excludeNumber]);
            unset($noteCounts[$excludeNumber]);
        }

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

    /**
     * Self-consistency check between the two stages of the same AI response:
     * flags a clinical acronym (e.g. "BNP") that appears in the rendered
     * fields but that the model never wrote in its own repaired_transcript.
     * This is NOT a medical-accuracy check against a drug/test vocabulary —
     * it only catches the AI's format stage introducing an entity its own
     * repair stage never produced (e.g. substituting "BNP" for "troponin").
     */
    private function reconcileEntities(string $repairedTranscript, array $fields): array
    {
        $fieldsText = implode(' ', array_map(function ($value) {
            if (is_array($value)) {
                $value = implode(' ', array_map('strval', $value));
            }
            return (string) $value;
        }, $fields));

        preg_match_all('/\b[A-Z]{2,6}\b/', $fieldsText, $m);
        $candidates = array_unique($m[0] ?? []);

        // Standard-vitals & standard-route whitelist: these are the accepted
        // clinical shorthand a physician expects to see in a formatted note
        // even when they spoke the long form ("blood pressure" -> BP). Flagging
        // them as unverified adds noise without adding safety, because there
        // is nowhere for the model to place these without a real dictated
        // value beside them (the numeric integrity check covers the value).
        static $whitelist = [
            'BP', 'HR', 'RR', 'HRR', 'T', 'TEMP', 'SPO', 'SPO2', 'O2', 'BMI',
            'ECG', 'EKG', 'GCS', 'CPR', 'CPR2', 'ROM',
            'IV', 'IM', 'PO', 'SC', 'SL', 'PR', 'PRN', 'STAT', 'BID', 'TID', 'QID', 'QD',
            'MG', 'ML', 'MMHG', 'BPM', 'KG', 'CM', 'MM', 'CC', 'IU', 'MCG',
        ];
        $whitelistSet = array_flip($whitelist);

        $unverified = [];
        foreach ($candidates as $candidate) {
            if (isset($whitelistSet[strtoupper($candidate)])) {
                continue;
            }
            if (!preg_match('/\b' . preg_quote($candidate, '/') . '\b/i', $repairedTranscript)) {
                $unverified[] = $candidate;
            }
        }

        return [
            'unverified_entities' => array_values($unverified),
        ];
    }

    /**
     * Third deterministic safety net: catch silent lowercase-entity
     * substitutions (drug names, lab tests) in critical fields the acronym
     * check cannot see. For every 7+ character alphabetic word inside a
     * field whose key names it as investigation/treatment/medication/lab,
     * we require SOME evidence of it in the RAW ASR transcript:
     *   1. exact case-insensitive substring match, OR
     *   2. 5-char prefix (stem) match — tolerates word-form changes like
     *      "improvement" -> "improved", OR
     *   3. Metaphone code match against any raw word — tolerates minor
     *      transcription noise.
     * If none apply, the term is a phonetically-implausible AI addition
     * (e.g. "procalcitonin" from "proponents") and must be flagged for
     * physician verification. This is NOT a medical vocabulary check.
     */
    private function reconcileCriticalTerms(string $rawTranscript, array $fields): array
    {
        $criticalKeyPattern = '/INVESTIGATION|TREATMENT|RECORD_OF|MEDICATION|LAB|IMAGING|PROCEDURE/i';

        $rawLower = mb_strtolower($rawTranscript);
        preg_match_all('/[a-zA-Z]{4,}/u', $rawLower, $rm);
        $rawWords = array_unique($rm[0] ?? []);
        $rawMetaphones = [];
        foreach ($rawWords as $rw) {
            $code = metaphone($rw);
            if ($code !== '' && $code !== false) {
                $rawMetaphones[$code] = true;
            }
        }

        $seen = [];
        foreach ($fields as $key => $value) {
            if (!preg_match($criticalKeyPattern, (string) $key)) {
                continue;
            }
            $text = is_array($value)
                ? implode(' ', array_map('strval', $value))
                : (string) $value;

            // Strip already-flagged uncertainty markers and the [Not Reported]
            // placeholder before scanning — never double-flag them.
            $text = preg_replace('/\[\?[^\]]*\]/u', ' ', $text);
            $text = preg_replace('/\[Not\s+Reported\]/iu', ' ', $text);

            preg_match_all('/[a-zA-Z]{7,}/u', $text, $wm);
            foreach ($wm[0] ?? [] as $word) {
                $wLower = mb_strtolower($word);
                if (isset($seen[$wLower])) {
                    continue;
                }
                // (1) exact case-insensitive substring — the doctor said it.
                if (str_contains($rawLower, $wLower)) {
                    $seen[$wLower] = 'verified';
                    continue;
                }
                // (2) 5-char stem match — tolerates word-form variation.
                $stem = mb_substr($wLower, 0, 5);
                if ($stem !== '' && str_contains($rawLower, $stem)) {
                    $seen[$wLower] = 'verified';
                    continue;
                }
                // (3) Metaphone equivalence — tolerates minor ASR noise.
                $wMeta = metaphone($word);
                if ($wMeta !== '' && $wMeta !== false && isset($rawMetaphones[$wMeta])) {
                    $seen[$wLower] = 'verified';
                    continue;
                }
                $seen[$wLower] = $word; // preserve original casing for display
            }
        }

        $unverified = [];
        foreach ($seen as $status) {
            if ($status !== 'verified') {
                $unverified[] = $status;
            }
        }

        return ['unverified_terms' => $unverified];
    }

    /**
     * Fourth safety net: polarity reversal check.
     *
     * A pure lexical scan for a specific class of clinically dangerous error:
     * the AI writing the OPPOSITE of what the doctor said around a shared
     * anchor term. Two documented failure modes this catches:
     *   - Positive→Negative: doctor says "chest pain", AI writes "denies chest pain"
     *   - Negative→Positive: doctor says "no fever", AI writes "fever present"
     *
     * Algorithm — for each 5+ char clinical anchor word that appears in BOTH
     * the raw ASR and the field text:
     *   1. Look at ±5 words around the anchor in the raw ASR — is any word
     *      a negation marker (no, not, without, denies, denied, absent,
     *      negative, none, deny, unremarkable)?
     *   2. Repeat in the field text.
     *   3. If the two polarities disagree → flag "term (field_key)".
     *
     * Deliberately conservative: skip anchors that appear more than once in
     * either text (context is ambiguous), skip very common English words that
     * add noise, and only look at whole-word matches to avoid false alarms on
     * sub-word substrings.
     */
    private function reconcilePolarity(string $rawTranscript, array $fields): array
    {
        // Negation markers common in medical dictation. Kept short and
        // English-only per the project's language scope.
        $negationWords = ['no', 'not', 'without', 'denies', 'denied', 'deny',
                          'absent', 'negative', 'none', 'unremarkable',
                          'never', 'nor', 'neither', 'nothing'];
        $negationSet = array_flip($negationWords);

        // Words too common to carry meaningful clinical polarity. Filtering
        // these keeps the check specific to medical anchors.
        $stopwords = array_flip([
            'patient', 'history', 'presents', 'reports', 'states', 'appears',
            'showed', 'shows', 'noted', 'examination', 'clinical', 'medical',
            'today', 'yesterday', 'currently', 'previously', 'admitted',
            'discharged', 'management', 'treatment', 'plan', 'follow', 'given',
            'started', 'continued', 'monitored', 'observed', 'assessment',
            'evaluation', 'diagnosis', 'complaint', 'condition', 'status',
            'course', 'stable', 'improved', 'worsened',
        ]);

        // ASR-artefact guard: "make sure to note ..." is routinely transcribed
        // as "make sure to not ...", dropping the trailing e. That plants a
        // false negation marker immediately before the clinical content the
        // physician is emphasising. Seen live on "make sure to not he severely
        // allergic to spin", which flagged hypertension / severely / allergic
        // as polarity reversals when nothing had been negated. A "not" in this
        // exact dictation-instruction position is the mangled verb, not a
        // negation, so it must not arm the probe.
        $isDictationNote = static function (array $tokens, int $idx): bool {
            if (($tokens[$idx] ?? '') !== 'not') {
                return false;
            }
            $prev1 = $tokens[$idx - 1] ?? '';
            $prev2 = $tokens[$idx - 2] ?? '';
            return $prev1 === 'to' && ($prev2 === 'sure' || $prev2 === 'make');
        };

        // Fast polarity probe: returns true if a negation word sits within
        // ±$window tokens of an anchor position in $tokens.
        $hasNegationNear = function (array $tokens, int $anchorIdx, int $window) use ($negationSet, $isDictationNote): bool {
            $start = max(0, $anchorIdx - $window);
            $end = min(count($tokens) - 1, $anchorIdx + $window);
            for ($i = $start; $i <= $end; $i++) {
                if ($i === $anchorIdx) continue;
                if (isset($negationSet[$tokens[$i]]) && !$isDictationNote($tokens, $i)) return true;
            }
            return false;
        };

        $rawTokens = $this->tokeniseForPolarity($rawTranscript);
        $rawIndex = $this->firstOccurrenceIndex($rawTokens);

        $flags = [];
        $seenFlagKeys = [];

        foreach ($fields as $fieldKey => $value) {
            $text = is_array($value)
                ? implode(' ', array_map('strval', $value))
                : (string) $value;

            // Skip placeholders and unverified markers — no assertion to reverse.
            $text = preg_replace('/\[\?[^\]]*\]/u', ' ', $text);
            $text = preg_replace('/\[Not\s+Reported\]/iu', ' ', $text);
            if (trim($text) === '') continue;

            $fieldTokens = $this->tokeniseForPolarity($text);
            $fieldIndex = $this->firstOccurrenceIndex($fieldTokens);

            foreach ($fieldIndex as $anchor => $fieldPos) {
                if (mb_strlen($anchor) < 5) continue;
                if (isset($stopwords[$anchor])) continue;
                if (isset($negationSet[$anchor])) continue;
                // Anchor must be shared with the raw ASR AND unique in each
                // side (multi-occurrence anchors have ambiguous context).
                if (!isset($rawIndex[$anchor])) continue;
                if ($this->countOccurrences($fieldTokens, $anchor) !== 1) continue;
                if ($this->countOccurrences($rawTokens, $anchor) !== 1) continue;

                $rawNeg = $hasNegationNear($rawTokens, $rawIndex[$anchor], 5);
                $fieldNeg = $hasNegationNear($fieldTokens, $fieldPos, 5);

                if ($rawNeg !== $fieldNeg) {
                    // Human-readable field label: FAMILY_EDUCATION → Family Education.
                    $niceKey = ucwords(strtolower(str_replace('_', ' ', (string) $fieldKey)));
                    $flagKey = "{$anchor}|{$niceKey}";
                    if (isset($seenFlagKeys[$flagKey])) continue;
                    $seenFlagKeys[$flagKey] = true;
                    $direction = $rawNeg ? 'dictation negated, note asserts' : 'dictation asserts, note negated';
                    $flags[] = "{$anchor} ({$niceKey}: {$direction})";
                }
            }
        }

        return ['polarity_flags' => $flags];
    }

    /**
     * Lowercase alphabetic tokeniser used by reconcilePolarity. Strips
     * punctuation and any non-letter run — including digits, since numeric
     * values are reconciled by reconcileNumbers, not here.
     */
    private function tokeniseForPolarity(string $text): array
    {
        $lower = mb_strtolower($text);
        preg_match_all('/[a-z]{2,}/', $lower, $m);
        return $m[0] ?? [];
    }

    /**
     * Map each unique token to the index of its FIRST occurrence, so
     * reconcilePolarity can look up an anchor's position in O(1).
     */
    private function firstOccurrenceIndex(array $tokens): array
    {
        $out = [];
        foreach ($tokens as $i => $t) {
            if (!isset($out[$t])) $out[$t] = $i;
        }
        return $out;
    }

    private function countOccurrences(array $tokens, string $needle): int
    {
        $c = 0;
        foreach ($tokens as $t) {
            if ($t === $needle) $c++;
        }
        return $c;
    }

    /**
     * Run all three deterministic safety nets over the extracted-fields map
     * used for external-form injection, comparing against the RAW ASR
     * transcript. Returns the same review shape as the visible-note path so the
     * frontend can render it with the existing banner component.
     *
     * The clinical section fields live nested under 'extra_fields'; they are
     * flattened to the top level first so their keys (INVESTIGATION, TREATMENT,
     * …) are visible to the critical-term key filter.
     */
    private function reviewExtractedFields(string $rawText, array $extractedFields): array
    {
        $flat = $this->flattenExtractedFields($extractedFields);
        $noteText = $this->renderFieldsToNote($flat);

        // Templates handle demographics manually — strip age from the
        // number-tracking pass so it can't be flagged as "missing" from
        // the injection preview just because no template field displays it.
        $patientAge = null;
        if (isset($extractedFields['age']) && is_numeric($extractedFields['age'])) {
            $patientAge = (string) (int) $extractedFields['age'];
        }

        $review = $this->reconcileNumbers($rawText, $noteText, $patientAge);

        $entityReview = $this->reconcileEntities($rawText, $flat);
        $review['unverified_entities'] = $entityReview['unverified_entities'];
        $review['passed'] = $review['passed'] && empty($entityReview['unverified_entities']);

        $termReview = $this->reconcileCriticalTerms($rawText, $flat);
        $review['unverified_terms'] = $termReview['unverified_terms'];
        $review['passed'] = $review['passed'] && empty($termReview['unverified_terms']);

        $polarityReview = $this->reconcilePolarity($rawText, $flat);
        $review['polarity_flags'] = $polarityReview['polarity_flags'];
        $review['passed'] = $review['passed'] && empty($polarityReview['polarity_flags']);

        return $review;
    }

    /**
     * Flatten the {name, age, gender, extra_fields: {...}} extraction map into a
     * single-level key => value map (mirrors mapExtractedFieldsToForm's flatten)
     * so the clinical section fields nested under 'extra_fields' become
     * top-level keys the reconciliation checks can inspect.
     */
    private function flattenExtractedFields(array $extractedFields): array
    {
        $flat = [];
        foreach ($extractedFields as $key => $value) {
            if ($value === null) {
                continue;
            }
            if ($key === 'extra_fields' && is_array($value)) {
                foreach ($value as $subKey => $subValue) {
                    if ($subValue !== null) {
                        $flat[$subKey] = $subValue;
                    }
                }
                continue;
            }
            $flat[$key] = $value;
        }
        return $flat;
    }

    /**
     * Derive the {name, age, gender, extra_fields} extraction map directly from
     * the repair+format envelope — no second AI call needed.
     *
     * For each section key in the envelope (e.g. "PATIENT_COMPLAINTS"), we
     * normalise it to lowercase-with-spaces ("patient complaints") and scan the
     * formFieldMappings labels for a case-insensitive match. The match maps the
     * envelope value to the correct form field name (e.g. "PatientcomplaintsText").
     *
     * "[Not Reported]" values are dropped (treated as null) so the external form
     * never receives that placeholder as a value.
     */
    private function deriveExtractedFieldsFromEnvelope(array $envelopeFields, ?array $patientInfo): array
    {
        $extraFields = [];
        $consumed = [];

        foreach ($envelopeFields as $sectionKey => $sectionValue) {
            $trimmed = trim((string) $sectionValue);
            if ($trimmed === '' || preg_match('/^\[Not\s+Reported\]/i', $trimmed)) {
                continue;
            }

            // "PATIENT_COMPLAINTS" → "patient complaints"
            $normalised = strtolower(str_replace('_', ' ', (string) $sectionKey));

            foreach ($this->formFieldMappings as $fieldDef) {
                $field = $fieldDef['form_field'];
                if (isset($consumed[$field])) {
                    continue;
                }
                foreach ($fieldDef['labels'] as $label) {
                    if (strtolower($label) === $normalised) {
                        $extraFields[$field] = $trimmed;
                        $consumed[$field] = true;
                        break 2;
                    }
                }
            }
        }

        return [
            'name' => isset($patientInfo['name']) && $patientInfo['name'] !== null
                ? (string) $patientInfo['name']
                : null,
            'age' => isset($patientInfo['age']) && $patientInfo['age'] !== null
                ? (int) $patientInfo['age']
                : null,
            'height' => null,
            'gender' => isset($patientInfo['gender']) && $patientInfo['gender'] !== null
                ? (string) $patientInfo['gender']
                : null,
            'extra_fields' => !empty($extraFields) ? $extraFields : null,
        ];
    }

    public function saveAnalysis(InboxNote $note, array $result, string $formName = 'general'): NoteAnalysis
    {
        // تحديد البيانات للحفظ
        $analysisData = [
            'extracted_fields' => $result['extracted_fields'] ?? null,
            'field_mappings' => $result['field_mappings'] ?? null,
            // Deterministic verification of the injection data vs the raw ASR,
            // surfaced on the injection-preview tab before the doctor injects.
            'review' => $result['review'] ?? null,
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

    private function getCompanySettings(): array
    {
        $user = auth()->user();
        if (!$user || !$user->company) {
            return [];
        }
        return $user->company->settings ?? [];
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
