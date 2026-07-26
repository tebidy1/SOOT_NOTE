<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Macro;
use App\Models\Company;

$prompt = <<<PROMPT
FORMAT AS: NABD V2 MEDICAL NOTE
Use structured plain text formatting. Do NOT use markdown.

CRITICAL EXTRACTION RULES:
- Extract data strictly from the transcript. Do NOT invent information.
- If a section's information is not mentioned, you MUST write exactly [Not Reported].
- DO NOT duplicate information across sections.

Dll_complaints:
- (CRITICAL: This is a dropdown field. Output ONLY a concise, standard medical term for the Chief Complaint. e.g., "Chest Pain", "Headache". No long sentences.)

PatientcomplaintsText:
- (Detailed description of the patient's complaints, symptoms, onset, and severity.)

txt_PatientNotes:
- (Any additional patient remarks, subjective feelings, or notes from the patient.)

PainScore:
- (CRITICAL: Output ONLY a single number from 1 to 10. If not mentioned, write [Not Reported].)

FamilyEducation:
- (Instructions, education, or return precautions given to the patient or family.)

txt_PatientHistoryOfPresentIlness:
- (Past medical history, previous surgeries, allergies if part of history, and chronicity of present illness.)

txt_PatientPhisicalExaminition:
- (Vital signs, general appearance, and system-specific physical examination findings.)

txt_PatientInvestigation:
- (Laboratory tests drawn, imaging ordered, EKG results, or pending diagnostics.)

txt_PatientMangementplan:
- (Future management, medications prescribed, disposition, and referrals.)

txt_NoteFromReceptionToDoctor:
- (Notes regarding arrival, triage, EMS handover, or reception remarks.)

txt_SignificantSign:
- (Critical patient alerts, strict allergies, or significant warning signs that need immediate attention.)

txt_OtherConditions:
- (Comorbidities or secondary medical conditions mentioned.)

txt_RecordOfTreatment:
- (Treatments, medications, or interventions already administered during this visit in the clinic/ER.)

txt_Diagnosis:
- (CRITICAL: This is a dropdown field. Output ONLY a concise, standard medical term for the Primary Diagnosis (e.g., "Essential Hypertension", "Acute Anterior STEMI"). No long explanations.)

DiagnosisSelect2:
- (Type of illness classification. Output ONLY "Acute", "Chronic", or "Acute on Chronic" based on context.)
PROMPT;

$content = $prompt;
$aiInstruction = $prompt;

// Update or create for company 1
Macro::updateOrCreate(
    ['trigger' => 'NABD V2', 'company_id' => 1],
    [
        'user_id' => 1,
        'is_ai_macro' => 1,
        'content' => $content,
        'ai_instruction' => $aiInstruction
    ]
);

// Update or create for company 4
Macro::updateOrCreate(
    ['trigger' => 'NABD V2', 'company_id' => 4],
    [
        'user_id' => 1,
        'is_ai_macro' => 1,
        'content' => $content,
        'ai_instruction' => $aiInstruction
    ]
);

// Also update all existing macros with trigger NABD V2
Macro::where('trigger', 'LIKE', '%NABD%')->update([
    'content' => $content,
    'ai_instruction' => $aiInstruction,
    'is_ai_macro' => 1
]);

echo "COMPLETED_MACROS_UPDATE\n";
