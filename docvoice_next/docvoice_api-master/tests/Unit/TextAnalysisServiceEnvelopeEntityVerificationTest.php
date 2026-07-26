<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * These tests lock in the P1 fix: entity verification MUST use the raw ASR
 * transcript (ground truth of what the doctor actually said) as the reference,
 * NOT the AI-generated repaired_transcript. Otherwise the model can substitute
 * a related-but-wrong clinical entity (e.g. "BNP" for "troponins") in BOTH
 * the repair AND format stages, and the self-consistency check passes
 * silently — exactly the failure mode observed with the COPD dictation.
 */
class TextAnalysisServiceEnvelopeEntityVerificationTest extends TestCase
{
    private function callBuildNoteFromEnvelope(string $responseText, string $rawText): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'buildNoteFromEnvelope');
        $method->setAccessible(true);

        return $method->invoke($service, $responseText, $rawText, 'test', null);
    }

    public function test_flags_acronym_the_ai_introduced_that_the_doctor_never_dictated(): void
    {
        // The exact production bug: Oracle heard "proponents" (troponins
        // misheard); the AI put "BNP" in both repaired_transcript and fields,
        // so a repaired-vs-fields consistency check passes — but the doctor
        // never said BNP. Only the RAW ASR transcript is ground truth.
        $raw = 'blood drawn for cbc abg and proponents';
        $envelope = json_encode([
            'repaired_transcript' => 'Blood drawn for CBC, ABG, BNP.',
            'flags' => [],
            'fields' => ['INVESTIGATION' => 'CBC, ABG, BNP.'],
        ]);

        $result = $this->callBuildNoteFromEnvelope($envelope, $raw);

        $this->assertContains('BNP', $result['review']['unverified_entities']);
        $this->assertFalse($result['review']['passed']);
    }

    public function test_does_not_flag_acronyms_the_doctor_actually_dictated_case_insensitive(): void
    {
        // The doctor really said BNP; Oracle transcribed lowercase "bnp".
        // We must not flag legitimately-dictated acronyms.
        $raw = 'blood drawn for cbc abg and bnp';
        $envelope = json_encode([
            'repaired_transcript' => 'Blood drawn for CBC, ABG, BNP.',
            'flags' => [],
            'fields' => ['INVESTIGATION' => 'CBC, ABG, BNP.'],
        ]);

        $result = $this->callBuildNoteFromEnvelope($envelope, $raw);

        $this->assertSame([], $result['review']['unverified_entities']);
        $this->assertTrue($result['review']['passed']);
    }

    public function test_realistic_copd_dictation_flags_only_the_substituted_entity(): void
    {
        // Reproduces the user's real COPD test case: BNP was substituted for
        // troponins, but every other acronym in the output (CBC, ABG, ECG,
        // CXR, COPD, DM, HTN, EMS, IV) was legitimately dictated. Only BNP
        // should be flagged — a single, actionable alert.
        $raw = 'pmh is significant perseverance opd type 2 dm and htn ' .
            'vitals are rr 28 hr 115 BP 152 over 95 and spo2 is 86% ' .
            'investigations include a bedside ecg showing sinus tachycardia ' .
            'and pending portable cxr blood drawn for cbc abg and proponents ' .
            'we administered 750 mg of IV level fluoxetine ' .
            'diagnosis is acute exacerbation of COPD ems';

        $envelope = json_encode([
            'repaired_transcript' => 'PMH: severe COPD, type 2 DM, HTN. ' .
                'Vitals: RR 28, HR 115, BP 152/95, SpO2 86%. ' .
                'Investigations: ECG, CXR, CBC, ABG, BNP. ' .
                'IV levofloxacin 750 mg. Arrived via EMS.',
            'flags' => [],
            'fields' => [
                'HISTORY_OF_PATIENT_ILLNESSES' => 'COPD, type 2 DM, HTN.',
                'PHYSICAL_EXAMINATION' => 'RR 28, HR 115, BP 152/95, SpO2 86%.',
                'INVESTIGATION' => 'ECG, CXR, CBC, ABG, BNP.',
                'RECORD_OF_TREATMENT' => 'IV levofloxacin 750 mg.',
                'RECEPTION_NOTES' => 'Arrived via EMS.',
            ],
        ]);

        $result = $this->callBuildNoteFromEnvelope($envelope, $raw);

        $this->assertSame(['BNP'], $result['review']['unverified_entities']);
    }

    public function test_does_not_flag_acronyms_when_raw_case_differs_from_output(): void
    {
        // Oracle inconsistently capitalises acronyms ("IV" vs "iv" in the
        // same paragraph). Verification must be case-insensitive so that a
        // correctly-dictated acronym never triggers a false review banner
        // just because Oracle changed its capitalisation.
        $raw = 'we administered iv fluids and iv antibiotics';
        $envelope = json_encode([
            'repaired_transcript' => 'IV fluids and IV antibiotics administered.',
            'flags' => [],
            'fields' => ['TREATMENT_PLAN' => 'IV fluids, IV antibiotics.'],
        ]);

        $result = $this->callBuildNoteFromEnvelope($envelope, $raw);

        $this->assertSame([], $result['review']['unverified_entities']);
    }
}
