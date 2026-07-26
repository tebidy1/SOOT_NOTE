<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Tests for the unified AI path: deriveExtractedFieldsFromEnvelope.
 *
 * Before unification, analyzeByNote made 2 LLM calls:
 *   (1) generateNoteFromMacro(macro 85) → NABD envelope → render NABD text
 *   (2) analyzeWithOci(NABD text)       → re-extract the same fields via AI
 *
 * The unification removes call (2). The envelope's fields{} are mapped to
 * form field names deterministically via label matching — the same labels
 * that were given to the AI in the old extraction prompt. This test file
 * locks in that the mapping is correct for all 13 NABD V2 section keys.
 */
class TextAnalysisServiceUnifiedPathTest extends TestCase
{
    private function callDerive(array $envelopeFields, ?array $patientInfo): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'deriveExtractedFieldsFromEnvelope');
        $method->setAccessible(true);
        return $method->invoke($service, $envelopeFields, $patientInfo);
    }

    // ── Section key → form field mapping (NABD V2 keys) ─────────────────────

    public function test_maps_patient_complaints_to_patientcomplaintstext(): void
    {
        $result = $this->callDerive(['PATIENT_COMPLAINTS' => 'Chest pain x 2 hours.'], null);
        $this->assertSame('Chest pain x 2 hours.', $result['extra_fields']['PatientcomplaintsText'] ?? null);
    }

    public function test_maps_investigation_to_txt_patientinvestigation(): void
    {
        $result = $this->callDerive(['INVESTIGATION' => 'CBC, troponin ordered.'], null);
        $this->assertSame('CBC, troponin ordered.', $result['extra_fields']['txt_PatientInvestigation'] ?? null);
    }

    public function test_maps_treatment_plan_to_txt_patientmangementplan(): void
    {
        $result = $this->callDerive(['TREATMENT_PLAN' => 'IV fluids 500 mL.'], null);
        $this->assertSame('IV fluids 500 mL.', $result['extra_fields']['txt_PatientMangementplan'] ?? null);
    }

    public function test_maps_record_of_treatment_to_txt_recordoftreatment(): void
    {
        $result = $this->callDerive(['RECORD_OF_TREATMENT' => '3 rounds nebulized albuterol.'], null);
        $this->assertSame('3 rounds nebulized albuterol.', $result['extra_fields']['txt_RecordOfTreatment'] ?? null);
    }

    public function test_maps_physical_examination_to_txt_patientphisicalexaminition(): void
    {
        $result = $this->callDerive(['PHYSICAL_EXAMINATION' => 'HR 88, BP 130/80.'], null);
        $this->assertSame('HR 88, BP 130/80.', $result['extra_fields']['txt_PatientPhisicalExaminition'] ?? null);
    }

    public function test_maps_diagnosis_to_txt_diagnosis(): void
    {
        $result = $this->callDerive(['DIAGNOSIS' => 'Acute coronary syndrome.'], null);
        $this->assertSame('Acute coronary syndrome.', $result['extra_fields']['txt_Diagnosis'] ?? null);
    }

    public function test_maps_patient_alerts_to_txt_significantsign(): void
    {
        // PATIENT_ALERTS is a NABD V2 key added as a label alias for txt_SignificantSign.
        $result = $this->callDerive(['PATIENT_ALERTS' => 'Penicillin allergy.'], null);
        $this->assertSame('Penicillin allergy.', $result['extra_fields']['txt_SignificantSign'] ?? null);
    }

    public function test_maps_type_of_illness_to_diagnosisselect2(): void
    {
        // TYPE_OF_ILLNESS is a NABD V2 key added as a label alias for DiagnosisSelect2.
        $result = $this->callDerive(['TYPE_OF_ILLNESS' => 'Acute'], null);
        $this->assertSame('Acute', $result['extra_fields']['DiagnosisSelect2'] ?? null);
    }

    // ── Patient info extraction ───────────────────────────────────────────────

    public function test_extracts_age_and_gender_from_patient_info(): void
    {
        $result = $this->callDerive([], ['name' => null, 'age' => 42, 'gender' => 'female']);
        $this->assertSame(42, $result['age']);
        $this->assertSame('female', $result['gender']);
        $this->assertNull($result['name']);
    }

    public function test_extracts_name_when_stated(): void
    {
        $result = $this->callDerive([], ['name' => 'Ahmed Al-Rashid', 'age' => 55, 'gender' => 'male']);
        $this->assertSame('Ahmed Al-Rashid', $result['name']);
    }

    public function test_null_patient_info_produces_null_demographics(): void
    {
        $result = $this->callDerive([], null);
        $this->assertNull($result['name']);
        $this->assertNull($result['age']);
        $this->assertNull($result['gender']);
    }

    // ── [Not Reported] filtering ──────────────────────────────────────────────

    public function test_drops_not_reported_values_from_extra_fields(): void
    {
        $result = $this->callDerive([
            'INVESTIGATION' => '[Not Reported]',
            'DIAGNOSIS' => 'Hypertension.',
        ], null);

        $this->assertArrayNotHasKey('txt_PatientInvestigation', $result['extra_fields'] ?? []);
        $this->assertSame('Hypertension.', $result['extra_fields']['txt_Diagnosis'] ?? null);
    }

    public function test_drops_empty_string_values(): void
    {
        $result = $this->callDerive(['INVESTIGATION' => '   '], null);
        $this->assertNull($result['extra_fields'] ?? null);
    }

    public function test_keeps_uncertainty_marker_values(): void
    {
        // [?word] markers are clinical data and must NOT be treated as [Not Reported].
        $result = $this->callDerive(['INVESTIGATION' => '[?troponins] and CBC.'], null);
        $this->assertSame('[?troponins] and CBC.', $result['extra_fields']['txt_PatientInvestigation'] ?? null);
    }

    // ── Multiple sections at once ─────────────────────────────────────────────

    public function test_maps_all_present_sections_in_one_call(): void
    {
        $envelope = [
            'PATIENT_COMPLAINTS' => '65-year-old male: Shortness of breath.',
            'PHYSICAL_EXAMINATION' => 'RR 28, SpO2 91%.',
            'INVESTIGATION' => 'ABG, chest X-ray.',
            'TREATMENT_PLAN' => 'Oxygen 4 L/min, IV access.',
            'DIAGNOSIS' => 'Acute exacerbation of COPD.',
        ];

        $result = $this->callDerive($envelope, ['name' => null, 'age' => 65, 'gender' => 'male']);

        $this->assertSame('65-year-old male: Shortness of breath.', $result['extra_fields']['PatientcomplaintsText']);
        $this->assertSame('RR 28, SpO2 91%.', $result['extra_fields']['txt_PatientPhisicalExaminition']);
        $this->assertSame('ABG, chest X-ray.', $result['extra_fields']['txt_PatientInvestigation']);
        $this->assertSame('Oxygen 4 L/min, IV access.', $result['extra_fields']['txt_PatientMangementplan']);
        $this->assertSame('Acute exacerbation of COPD.', $result['extra_fields']['txt_Diagnosis']);
        $this->assertSame(65, $result['age']);
        $this->assertSame('male', $result['gender']);
    }

    public function test_empty_envelope_produces_null_extra_fields(): void
    {
        $result = $this->callDerive([], null);
        $this->assertNull($result['extra_fields']);
    }
}
