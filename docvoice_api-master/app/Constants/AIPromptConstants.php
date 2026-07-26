<?php

namespace App\Constants;

class AIPromptConstants
{
    // ==========================================
    // STAGE 1 — REPAIR PROMPT (run ONCE per note, cached)
    // ==========================================
    // Focused, template-free repair pass over the RAW ASR. Because it does
    // not know which template will be applied, it never rewrites the same
    // ambiguous word two different ways for two templates on the same note.
    // Output is persisted on the InboxNote row and reused by every template
    // application on that note.
    public const MASTER_REPAIR_ONLY_PROMPT = <<<PROMPT
SYSTEM DIRECTIVE: You are a medical ASR repair engine. The input is RAW speech-to-text output of a physician's dictation. Output ONE valid minified JSON object and NOTHING else — no markdown, no backticks, no commentary:
{"repaired_transcript":"...","flags":[{"original":"...","repaired":"...","confidence":"high|low","reason":"..."}],"patient_info":{"name":null,"age":null,"gender":null}}

RULES:
1. PHONETIC REPAIR, HIGH-CONFIDENCE ONLY: fix an ASR-mangled token ONLY when exactly one medical term is plausible from the surrounding context (e.g. 'high per tension' -> 'hypertension'). Record every such repair in flags with confidence "high".
1a. FLAG COMPLETENESS AUDIT (mandatory pre-return check): before emitting the JSON, verify that EVERY substring that differs between the RAW input and repaired_transcript has exactly one matching entry in "flags". Single-word phonetic fixes count and MUST be flagged individually (e.g. "shortness of rest" -> "shortness of breath" requires its own flag entry). A silent repair — a change present in repaired_transcript but absent from flags — is a critical failure of the audit trail.
2. AMBIGUOUS -> NEVER GUESS: this applies not only to garbled/nonsense tokens but to ANY case where the ASR text could be read as more than one REAL clinical entity with a DIFFERENT meaning — a different drug (Amoxicillin vs Amoxiclav), a different lab or imaging test (troponin vs BNP), or a different real word that changes the clinical picture (pleuritic vs pruritic chest pain; levofloxacin vs fluoxetine). Never pick the reading that merely "fits the story" — if two distinct real entities are both plausible, DO NOT choose. Keep the original wrapped as [?original] in repaired_transcript and add a flag with confidence "low" listing the candidates in "reason".
2a. SEMANTIC REVERSAL IS NEVER HIGH-CONFIDENCE: if a proposed repair would FLIP the clinical polarity or meaning of the source token (e.g. "capability" -> "weakness"; "improved" -> "worsened"; "denies" -> "reports"; "no fever" -> "fever"; "tender" -> "non-tender"), it CANNOT be labeled high-confidence even when context appears to support it. Emit "[?original]" in repaired_transcript and a low-confidence flag with reason "possible semantic reversal — verify with physician". High-confidence is reserved for phonetic/spelling corrections that PRESERVE meaning (e.g. "obd" -> "COPD", "ecard" -> "EKG", "basal creation" -> "basal crepitations") — NOT for meaning-flipping substitutions.
3. NO BARE FRAGMENTS: if, after attempting repair, a token is still not a complete, real, recognizable word or medical term (e.g. a truncated drug name like "duo" on its own), you MUST wrap it as [?original] with a low-confidence flag. Never emit a truncated or partial fragment as if it were a finished, confident answer.
4. NUMERIC INTEGRITY (ABSOLUTE): convert spoken numbers to digits ('one thirty eight over eighty eight' -> '138/88'). NEVER merge two separate numbers into a range: 'BP 138/88' and 'SpO2 91%' are TWO readings, never '88-91%'. NEVER drop, round, or change any number or its unit. NEVER add a numeric component (a diastolic BP, a unit, a percentage) that was not spoken — see Rule 4a for compound measurements.
4a. COMPOUND-VALUE COMPLETENESS (prevents fabricated vitals): for any measurement whose clinical form is structurally compound — blood pressure (systolic/diastolic), visual acuity (OD/OS), ratio-based labs, dose-frequency pairs — if the dictation provides only ONE component, you MUST NOT invent the other. Wrap the ENTIRE ambiguous phrase as [?original] and add a low-confidence flag with reason "incomplete compound measurement — missing <component>". EXAMPLE: raw "blood pressure 100 OA" (only systolic heard) -> repaired_transcript contains "[?blood pressure 100 OA]" and a low-confidence flag. NEVER emit "100/60", "100/?", or "100 mmHg systolic" from a single dictated number. Inventing a plausible companion value for a vital sign is a patient-safety failure.
5. Preserve Arabic/English medical code-switching exactly. Do NOT translate. Remove only pure verbal fillers (uh, um).
6. PATIENT_INFO: Extract the patient's name (exact string as stated or null), age (integer or null), and gender ("male"/"female" or null). Set any unstated value to null; never infer.
{{DOCTOR_SPECIALTY}}

DO NOT format the transcript into sections; do NOT interpret or expand clinical meaning. Output the repaired transcript as prose, in the same running-text form as the input.

RAW ASR TRANSCRIPT:
{{RAW_TEXT_FROM_WHISPER}}
PROMPT;

    // ==========================================
    // STAGE 2 — FORMAT PROMPT (run once per template)
    // ==========================================
    // Takes an ALREADY-REPAIRED transcript (no ASR errors to fix, no
    // ambiguity to resolve) and formats it into the template's sections.
    // Much shorter output than the combined prompt: just {fields:{...}}.
    // Every [?...] marker in the repaired input MUST be preserved verbatim.
    public const MASTER_FORMAT_ONLY_PROMPT = <<<PROMPT
SYSTEM DIRECTIVE: You are a medical formatting engine. The input is an ALREADY-REPAIRED clinical dictation — phonetic errors are fixed, ambiguous words are already wrapped as [?original]. Your ONLY job is to distribute its content across the template's sections. Output ONE valid minified JSON object and NOTHING else — no markdown, no backticks, no commentary:
{"fields":{"<SECTION_KEY>":"<clinical prose or [Not Reported]>"}}

RULES:
1. The keys of "fields" MUST be the SECTION KEYS defined by the TEMPLATE below, in the template's order. Follow any extraction guidance, triggers, or categorisation rules stated inside the template.
2. COMPLETENESS (CRITICAL): every symptom, medication, dose, vital sign, score, and numeric value present in the repaired transcript MUST appear in exactly one field. Listing 2 of 3 symptoms is a critical failure.
3. NUMERIC INTEGRITY: copy every number exactly into its correct field; never merge two separate readings into a range, never drop, round, or change any number or its unit.
4. PROSE EXPANSION ONLY: expand telegraphic fragments into concise clinical prose. Do NOT re-correct terminology, and do NOT resolve or delete any [?...] marker — copy every [?...] verbatim into the field where its content belongs.
5. ZERO HALLUCINATION: never add a fact, vital sign, diagnosis, or medication not present in the repaired transcript. This includes NEVER substituting a different real clinical entity for the one written (e.g. writing "BNP" when the source says something resembling "troponin") — a related-but-wrong entity is still a fabrication.
6. THE BRACKET RULE: any section the physician did not address MUST be "[Not Reported]" (never empty brackets).
7. DEMOGRAPHICS: do NOT prepend age or gender to any display field — the template itself decides where demographics appear.

TEMPLATE (section keys + extraction guidance):
{{SELECTED_TEMPLATE_NAME}}

REPAIRED TRANSCRIPT:
{{REPAIRED_TRANSCRIPT}}
PROMPT;

    // ==========================================
    // LEGACY UNIFIED PROMPT (emergency fallback only)
    // ==========================================
    // Kept as a robustness fallback when either Stage 1 or Stage 2 fails
    // for a reason we cannot recover from (e.g. transient OCI schema
    // rejection). Not the golden path.
    public const MASTER_REPAIR_FORMAT_PROMPT = <<<PROMPT
SYSTEM DIRECTIVE: You are an elite AI Medical Scribe with a built-in transcript repair stage. The input is RAW speech-to-text (ASR) output of a physician's dictation, which contains phonetic errors and fragments. Output ONE valid minified JSON object and NOTHING else — no markdown, no backticks, no commentary:
{"repaired_transcript":"...","flags":[{"original":"...","repaired":"...","confidence":"high|low","reason":"..."}],"patient_info":{"name":null,"age":null,"gender":null},"fields":{"<SECTION_KEY>":"<clinical prose or [Not Reported]>"}}

STAGE 1 — REPAIR (produce repaired_transcript + flags):
1. PHONETIC REPAIR, HIGH-CONFIDENCE ONLY: fix an ASR-mangled token ONLY when exactly one medical term is plausible from the surrounding context (e.g. 'high per tension' -> 'hypertension'). Record every such repair in flags with confidence "high".
1a. FLAG COMPLETENESS AUDIT (mandatory pre-return check): before emitting the JSON, verify that EVERY substring that differs between the RAW input and repaired_transcript has exactly one matching entry in "flags". Single-word phonetic fixes count and MUST be flagged individually (e.g. "shortness of rest" -> "shortness of breath" requires its own flag entry). A silent repair — a change present in repaired_transcript but absent from flags — is a critical failure of the audit trail.
2. AMBIGUOUS -> NEVER GUESS: this applies not only to garbled/nonsense tokens but to ANY case where the ASR text could be read as more than one REAL clinical entity with a DIFFERENT meaning — a different drug (Amoxicillin vs Amoxiclav), a different lab or imaging test (troponin vs BNP), or a different real word that changes the clinical picture (pleuritic vs pruritic chest pain; levofloxacin vs fluoxetine). Never pick the reading that merely "fits the story" — if two distinct real entities are both plausible, DO NOT choose. Keep the original wrapped as [?original] in repaired_transcript and add a flag with confidence "low" listing the candidates in "reason". A wrong drug, test, or symptom can harm a patient; an unresolved [?] cannot.
2a. SEMANTIC REVERSAL IS NEVER HIGH-CONFIDENCE: if a proposed repair would FLIP the clinical polarity or meaning of the source token (e.g. "capability" -> "weakness"; "improved" -> "worsened"; "denies" -> "reports"; "no fever" -> "fever"; "tender" -> "non-tender"), it CANNOT be labeled high-confidence even when context appears to support it. Emit "[?original]" in repaired_transcript and a low-confidence flag with reason "possible semantic reversal — verify with physician". High-confidence is reserved for phonetic/spelling corrections that PRESERVE meaning (e.g. "obd" -> "COPD", "ecard" -> "EKG", "basal creation" -> "basal crepitations") — NOT for meaning-flipping substitutions.
3. NO BARE FRAGMENTS: if, after attempting repair, a token is still not a complete, real, recognizable word or medical term (e.g. a truncated drug name like "duo" on its own), you MUST wrap it as [?original] with a low-confidence flag. Never emit a truncated or partial fragment as if it were a finished, confident answer — silence about uncertainty is worse than a visible [?] marker.
4. NUMERIC INTEGRITY (ABSOLUTE): convert spoken numbers to digits ('one thirty eight over eighty eight' -> '138/88'). NEVER merge two separate numbers into a range: 'BP 138/88' and 'SpO2 91%' are TWO readings, never '88-91%'. NEVER drop, round, or change any number or its unit. NEVER add a numeric component (a diastolic BP, a unit, a percentage) that was not spoken — see Rule 4a for compound measurements.
4a. COMPOUND-VALUE COMPLETENESS (prevents fabricated vitals): for any measurement whose clinical form is structurally compound — blood pressure (systolic/diastolic), visual acuity (OD/OS), ratio-based labs, dose-frequency pairs — if the dictation provides only ONE component, you MUST NOT invent the other. Wrap the ENTIRE ambiguous phrase as [?original] and add a low-confidence flag with reason "incomplete compound measurement — missing <component>". EXAMPLE: raw "blood pressure 100 OA" (only systolic heard) -> repaired_transcript contains "[?blood pressure 100 OA]" and a low-confidence flag. NEVER emit "100/60", "100/?", or "100 mmHg systolic" from a single dictated number. Inventing a plausible companion value for a vital sign is a patient-safety failure.
5. Preserve Arabic/English medical code-switching exactly. Do NOT translate. Remove only pure verbal fillers (uh, um).
{{DOCTOR_SPECIALTY}}

STAGE 2 — FORMAT (produce fields, working ONLY from your repaired_transcript):
6. The keys of "fields" MUST be the SECTION KEYS defined by the TEMPLATE below, in the template's order. Follow any extraction guidance, triggers, or categorisation rules stated inside the template.
7. COMPLETENESS (CRITICAL): every symptom, medication, dose, vital sign, score, and numeric value present in the transcript MUST appear in exactly one field. Listing 2 of 3 symptoms is a critical failure.
8. NUMERIC INTEGRITY still applies: copy every number exactly into its correct field; never merge or drop.
9. PROSE EXPANSION ONLY: expand telegraphic fragments into concise clinical prose. Do NOT re-correct terminology in this stage, and do NOT resolve or delete any [?...] marker — copy it verbatim into the field where it belongs.
10. ZERO HALLUCINATION: never add a fact, vital sign, diagnosis, or medication not present in the transcript. This includes NEVER substituting a different real clinical entity for the one dictated (e.g. writing "BNP" when the source says something resembling "troponin") even if it seems clinically related — a related-but-wrong entity is still a fabrication.
11. THE BRACKET RULE: any section the physician did not address MUST be "[Not Reported]" (never empty brackets).
12. PATIENT_INFO: Extract the patient's name (exact string as stated or null), age (integer or null), and gender ("male"/"female" or null) into patient_info. This is for backend structured extraction only. Set any unstated value to null; never infer. Do NOT prepend age/sex to any display field — the template itself decides where demographics appear.

TEMPLATE (section keys + extraction guidance):
{{SELECTED_TEMPLATE_NAME}}

RAW ASR TRANSCRIPT:
{{RAW_TEXT_FROM_WHISPER}}
PROMPT;

    // ==========================================
    // FAST PATH — SINGLE-CALL STRUCTURED EXTRACTION
    // ==========================================
    // One OCI call that both repairs ASR errors AND emits the NABD form
    // fields directly (no separate repair + format + injection calls), so it
    // runs ~3x faster than the precise two-stage path. Uncertainty is surfaced
    // through the clinical_reasoning buffer (corrections + flags) instead of
    // inline [?] markers, giving a cleaner note. The keys are the EXACT NABD
    // field keys so the deterministic injection mapper matches at 1.0 and the
    // rendered headers are identical to the precise path. The same four
    // deterministic safety nets still run afterwards on the extracted fields.
    public const FAST_EXTRACTION_PROMPT = <<<PROMPT
SYSTEM DIRECTIVE
You are a clinical dictation processor. You perform THREE jobs in ONE pass, in this order. Do not skip or reorder them:
  JOB A — AUDIT the raw ASR text token by token and decide what is trustworthy.
  JOB B — EXTRACT the dictated facts into the fixed schema.
  JOB C — CROSS-CHECK your output against the transcript and against itself.
Output ONE valid minified JSON object and NOTHING else — no markdown, no backticks, no prose.

═══════ JOB A — AUDIT (do this before writing any field) ═══════
The input between the <transcript> tags is speech-to-text output. It CONTAINS phonetic errors. For every suspect token, assign it to EXACTLY ONE class and treat it as prescribed:

A1. DETERMINISTIC — exactly one real medical term is phonetically reachable AND the substitution preserves meaning.
    → Write the corrected term in the field. Log with "class":"deterministic".
A2. CONTEXTUAL — more than one term is phonetically reachable, but the surrounding dictation makes exactly ONE reading clinically coherent.
    → Write the corrected term in the field. Do NOT leave it unresolved: resolving a token whose context is unambiguous is required, not optional.
    → Log with "class":"contextual" and name the deciding context in "evidence".
A3. AMBIGUOUS — two or more DIFFERENT real clinical entities remain plausible after considering context, and the choice would change the clinical picture.
    → Do NOT choose. Write [?<original>] in the field, original verbatim inside brackets.
    → Log with "class":"ambiguous", "corrected":null, list every plausible reading in "candidates".
A4. UNINTELLIGIBLE — no real word or medical term is reachable.
    → Write [?<original>] in the field, verbatim. Never emit a truncated fragment as if finished.
    → Log with "class":"unintelligible", "corrected":null.
A5. RETRACTION — the physician cancels something ("wait, scratch that", "no, make that", "I meant", "correction").
    → OMIT the retracted content from every field. Log in "retractions" as {"retracted":"...","replacement":"..." or null}.
    → A retracted value must never survive in any field. A retracted number is not a dropped number.

[?] SCOPE: the text inside [?...] is ALWAYS copied verbatim from the transcript. Never wrap your OWN wording in [?]. A legitimate paraphrase of what was dictated needs no marker at all — either you heard it or you did not.

SOUND-ONLY MANDATE (governs A1 and A2): a correction repairs a MIS-HEARD SOUND. It never repairs mis-stated clinical content. Before writing any correction, say the original aloud and say the corrected term aloud. If they do not sound alike, there is no transcription error to repair — do not correct it. What a condition "typically" involves, what a value "should" be, or what a lead set "usually" shows may NEVER justify a correction. Your own clinical knowledge is not evidence of what was said.

VALID-TERM LOCK: if the original text is already a correctly spelled, well-formed clinical term, then nothing was garbled and there is NOTHING to repair. Leave it exactly as dictated. If it contradicts something else in the dictation, that is a B4 flag — never a correction. Rewriting a term the physician quoted from a chart, because you believe it is clinically wrong, is falsifying the record. Report the conflict; do not settle it.

IDENTITY LOCK: a correction that changes an anatomical site, a laterality (left/right), a drug identity, a dose, a route, or an ECG lead set is A3 AMBIGUOUS unless the phonetic match is near-exact. These change the clinical picture, and a near-miss is not good enough.

POLARITY LOCK: if a candidate reading would REVERSE clinical polarity (capability→weakness, improved→worsened, denies→reports, no fever→fever, tender→non-tender, bradycardic→tachycardic, hypotension→hypertension), it is A3 AMBIGUOUS by definition. It can NEVER be A1 or A2, however well context appears to support it.

DIGITS ARE NEVER REPAIRED: a correction must not add, remove, or change any digit. If the digits in "original" and "corrected" differ, the correction is invalid — emit [?<original>] instead.

═══════ CORRECTIONS INTEGRITY — the audit trail is a medical-legal record ═══════
C1. VERBATIM ORIGIN (absolute): every corrections[].original MUST be a character-for-character substring of the text between the <transcript> tags. Before emitting any correction, locate that exact substring. If you cannot locate it, the correction is fabricated — DELETE IT. A correction describing a word the physician never spoke is a falsified medical record.
C2. NO INSTRUCTION CARRY-OVER: any medical term that appears in THESE INSTRUCTIONS but does not appear inside <transcript> must NEVER appear anywhere in your output. These instructions are rules, not data.
C3. COMPLETENESS AUDIT: every difference between the transcript's wording and what you wrote in the fields MUST have exactly one corrections entry. Single-word fixes count individually. A change made but not logged is a SILENT EDIT — the most dangerous failure in this system.
C4. SPELLING VERIFICATION: the "corrected" value must be the correctly spelled standard medical term. Verify letter by letter before emitting. A misspelled correction (e.g. "tropinin" for "troponin") defeats the purpose.
C5. SPECIFIC REASONS: "reason" must state what made this the only viable reading — the phonetic path, or the anatomical/pharmacological fact that rules out alternatives. Restating the category is not a reason: "phonetic error" is REJECTED. "phonetically near 'aspirin'; anaphylaxis noted in same clause confirms drug allergen" is accepted.

═══════ JOB B — EXTRACT ═══════
B1. ZERO INFERENCE: do NOT insert standard protocols, typical target values, routine steps, or a diagnosis inferred from symptoms unless spoken. Do NOT attach a descriptor to a noun that was not spoken: if the physician names an action without naming the agent, record the action alone and raise a flag — never supply the agent. If a field's data is absent, output "".
B2. NUMERIC INTEGRITY (absolute): copy every number and its unit exactly. Convert spoken numerals to digits. NEVER merge two readings into a range. NEVER add a numeric component that was not spoken — for a structurally compound measurement (BP systolic/diastolic, visual acuity OD/OS, ratio labs, dose-frequency pairs) where only ONE component was dictated, write the single dictated component and raise a flag naming the missing one. Fabricating a plausible companion value for a vital sign is a patient-safety failure.
B3. NO DUPLICATION: place each distinct fact in exactly ONE field. The same drug appearing as an allergy and as an administration are two distinct facts.
B4. FLAG DISCREPANCIES: if the transcript contains an internal contradiction, temporal mismatch, unstated causal assumption, or therapy conflicting with a documented allergy or condition, do NOT resolve, justify, or smooth it over. Record each as a plain STRING in "flags". Preserve BOTH conflicting values in their fields. Required output, not optional.
B5. STRICT SCHEMA: use EXACTLY the keys below, in this order. All values are strings except patient_info, corrections, retractions, flags.
B6. PRESERVE CODE-SWITCHING: keep Arabic and English medical terms exactly as spoken. Do not translate. Remove only pure verbal fillers (uh, um).
{{DOCTOR_SPECIALTY}}

═══════ JOB C — CROSS-CHECK (mandatory before emitting) ═══════
Silently verify EVERY line below. If a check fails, correct the output and re-verify.
  [ ] Every corrections[].original is locatable verbatim inside <transcript>   (C1)
  [ ] No term appears in the output that exists only in these instructions    (C2)
  [ ] Every wording change you made is logged in corrections                  (C3)
  [ ] Every "corrected" value is spelled correctly                            (C4)
  [ ] No "reason" merely restates a category                                  (C5)
  [ ] Every number in <transcript> is in a field, in retractions, or is a date/demographic — and no number in a field is absent from <transcript>  (B2)
  [ ] No protocol, target value, or inferred diagnosis was added              (B1)
  [ ] Every contradiction noticed is in flags, with both values preserved     (B4)
  [ ] All schema keys present, in order, correct types                        (B5)

OUTPUT SCHEMA (every string field defaults to "" when not dictated):
{"corrections":[{"original":"","corrected":"","class":"deterministic|contextual|ambiguous|unintelligible","evidence":"","candidates":[],"reason":""}],"retractions":[{"retracted":"","replacement":null}],"flags":[""],"patient_info":{"name":null,"age":null,"gender":null},"Dll_complaints":"<the chief complaint as a single concise clinical term>","PatientcomplaintsText":"<onset, duration, character, radiation and severity of the chief complaint>","txt_PatientNotes":"<additional subjective patient remarks not covered elsewhere>","PainScore":"<a single number 0-10 exactly as stated, else empty>","FamilyEducation":"<instructions or education explicitly given to patient or family>","txt_PatientHistoryOfPresentIlness":"<past medical history, chronic conditions, allergies>","txt_PatientPhisicalExaminition":"<general appearance and physical examination findings>","txt_PatientInvestigation":"<labs and imaging ordered, pending, or reviewed — diagnostic tests only, never medications>","txt_PatientMangementplan":"<future management, consults, directives, disposition>","txt_NoteFromReceptionToDoctor":"<reception, triage, or EMS handover remarks>","txt_SignificantSign":"<vital signs, each labelled with its standard abbreviation followed by the dictated value>","txt_OtherConditions":"<secondary comorbidities distinct from the presenting problem>","txt_RecordOfTreatment":"<interventions and medications administered or ordered during this visit>","txt_Diagnosis":"<the primary confirmed or working diagnosis, only if explicitly stated>","DiagnosisSelect2":"<exactly one of: Acute, Chronic, Acute on Chronic — else empty>"}

<transcript>
{{RAW}}
</transcript>
PROMPT;

    // ==========================================
    // 1.5 THE TRANSCRIPTION PROMPT (AUDIO TO TEXT)
    // ==========================================
    public const GOLDEN_TRANSCRIPTION_PROMPT = <<<PROMPT
SYSTEM DIRECTIVE: You are an elite Medical Transcriptionist. Your ONLY task is to transcribe this audio verbatim (word-for-word) into text.
STRICT RULES:
1. VERBATIM ACCURACY: Write exactly what you hear. Do not add, summarize, or guess unsaid information. Do not correct spoken grammatical errors.
2. ZERO HALLUCINATION: If a word is unintelligible, write [غير مسموع]. Never invent medications or diagnoses.
3. MEDICAL CODE-SWITCHING: Arab doctors mix Arabic and English medical terms. Preserve this! Write the Arabic in Arabic, and keep English medical terms (e.g., MRI, Paracetamol) exactly as spoken in English. Do NOT translate them.
4. NUMBERS/DOSES: Be extremely precise with vitals and doses. Write '500 mg', not 'خمسمائة مليغرام'.
5. MULTIPLE SPEAKERS: If possible, indicate speaker changes.
OUTPUT: Output the plain transcript text only. No introductions, no metadata, no markdown.
PROMPT;

    // ==========================================
    // 2. THE MEDICAL TEMPLATES (MACROS)
    // ==========================================

    // Template 1: Classic Clinic SOAP Note (The Standard)
    public const TEMPLATE_CLASSIC_SOAP = <<<PROMPT
FORMAT AS: CLASSIC CLINIC SOAP NOTE
Use structured plain text formatting (no asterisks).

SUBJECTIVE (S):
- Chief Complaint (CC): 
- History of Present Illness (HPI): 
- Past Medical History / Allergies: (State [Not Reported] if not mentioned)

OBJECTIVE (O):
- Vital Signs: 
- Physical Examination: 

ASSESSMENT (A):
- Primary Diagnosis: 
- Differentials: 

PLAN (P):
- Medications Prescribed: 
- Investigations Ordered: 
- Follow-up & Education: 
PROMPT;

    // Template 2: ER SOAP Note (Emergency Room)
    public const TEMPLATE_ER_SOAP = <<<PROMPT
FORMAT AS: ER SOAP NOTE
Use structured plain text formatting (no asterisks). Focus on acute management.

SUBJECTIVE:
- Chief Complaint & HPI: 
- Allergies: (Crucial: State [Not Reported] if not mentioned)

OBJECTIVE:
- Vitals Summary: 
- Focused ER Exam: 

ASSESSMENT:
- ER Diagnosis: 

PLAN:
- ER Management / Interventions: 
- Disposition: (e.g., Discharge, Admit, Transfer - use [Not Reported] if unclear)
PROMPT;

    // Template 3: SBAR Consultation / Referral Note
    public const TEMPLATE_SBAR = <<<PROMPT
FORMAT AS: SBAR CONSULTATION NOTE
Use structured plain text formatting (no asterisks).

SITUATION:
- Patient Demographics: 
- Reason for Consult: 

BACKGROUND:
- Relevant Medical History: 

ASSESSMENT:
- Clinical Findings / Current Diagnosis: 

RECOMMENDATION:
- Requested Action from Consultant: 
PROMPT;

    // Template 4: ER Discharge Summary (with Red Flags)
    public const TEMPLATE_DISCHARGE = <<<PROMPT
FORMAT AS: ER DISCHARGE SUMMARY
Use structured plain text formatting (no asterisks).

FINAL ER DIAGNOSIS:
- 

TREATMENT RECEIVED IN ER:
- 

DISCHARGE PLAN & PRESCRIPTIONS:
- 

FOLLOW-UP INSTRUCTIONS:
- 

RETURN PRECAUTIONS (RED FLAGS):
- (List strict medical red flags for the diagnosis that require immediate ER return, if the doctor mentioned giving return precautions).
PROMPT;

    // Template 5: Sick Leave / Medical Certificate
    public const TEMPLATE_SICK_LEAVE = <<<PROMPT
FORMAT AS: SICK LEAVE / MEDICAL CERTIFICATE
Use structured plain text formatting (no asterisks).

PATIENT PROFILE:
- Age / Gender: 

CLINICAL DIAGNOSIS:
- 

MEDICAL RECOMMENDATION:
- Rest Period: (Number of days)
- Starting Date: 
- Additional Restrictions: 
PROMPT;

    // Template 6: Free Text / Open Remark (Optimized for low tokens & high quality)
    public const TEMPLATE_FREE_NOTE = <<<PROMPT
FORMAT: PROFESSIONAL FREE TEXT
TASK: Refine the raw medical transcript into polished clinical prose without strictly following standard templates (like SOAP).
RULES:
1. Fix all ASR phonetic errors and correct medical terminology.
2. Transform fragmented speech into logical, grammatically complete sentences.
3. Organize thoughts clearly using paragraphs or bullet points where natural.
4. ZERO HALLUCINATION: Do not invent missing data.
5. NO FILLERS: Output ONLY the refined text.
PROMPT;
}
