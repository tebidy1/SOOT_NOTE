<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Locks in the phonetic safety-net for silent entity substitutions in
 * critical fields (INVESTIGATION, RECORD_OF_TREATMENT, TREATMENT_PLAN):
 *
 *   - Real dictation of "troponins" was misheard by Oracle as "proponents";
 *     the AI silently substituted "procalcitonin" (a different lab test).
 *   - Real dictation of "Duoneb" was misheard as "to one"; the AI silently
 *     substituted "albuterol" (a different drug).
 *
 * These are lowercase multi-syllable words, so the existing uppercase-only
 * acronym check cannot catch them. This deterministic check flags any 7+
 * character alphabetic term in a critical field that has NO exact match,
 * NO 5-char prefix (stem) match, and NO Metaphone match in the raw ASR
 * transcript — the only ground truth of what the doctor actually said.
 */
class TextAnalysisServiceCriticalTermsTest extends TestCase
{
    private function callReconcileCriticalTerms(string $raw, array $fields): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'reconcileCriticalTerms');
        $method->setAccessible(true);

        return $method->invoke($service, $raw, $fields);
    }

    public function test_flags_procalcitonin_substituted_for_proponents_in_investigation_field(): void
    {
        $raw = 'blood drawn for cbc a bg and proponents';
        $fields = [
            'INVESTIGATION' => 'Blood drawn for CBC, ABG, and procalcitonin.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertContains('procalcitonin', $result['unverified_terms']);
    }

    public function test_flags_albuterol_substituted_for_to_one_in_record_of_treatment_field(): void
    {
        $raw = 'we administered 3 rounds of nebulized to one 40 mg IV solved';
        $fields = [
            'RECORD_OF_TREATMENT' => '3 rounds nebulized albuterol, 40 mg IV solumedrol.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertContains('albuterol', $result['unverified_terms']);
    }

    public function test_does_not_flag_a_term_whose_root_appears_in_raw(): void
    {
        // "improved" is not in raw verbatim (raw says "improvement"), but
        // the shared 5-char prefix "impro" means it's a legitimate word-form
        // change, not a substitution. Must not flag.
        $raw = 'reassessment showed marked improvement';
        $fields = [
            'RECORD_OF_TREATMENT' => 'SpO2 improved to 93%.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertNotContains('improved', $result['unverified_terms']);
    }

    public function test_does_not_flag_terms_the_doctor_said_verbatim_case_insensitive(): void
    {
        // Every 7+ char word in the field is present in raw somewhere.
        // Should produce zero unverified terms.
        $raw = 'investigations include a bedside ecg showing sinus tachycardia clear bedside ultrasound and pending portable cxr';
        $fields = [
            'INVESTIGATION' => 'Bedside ECG showing sinus tachycardia, clear bedside ultrasound, pending portable CXR.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertSame([], $result['unverified_terms']);
    }

    public function test_ignores_words_inside_uncertainty_markers(): void
    {
        // Words wrapped in [?...] are already flagged with the amber marker.
        // We must not double-flag them in unverified_terms.
        $raw = 'we administered 750 mg of IV level fluoxetine';
        $fields = [
            'RECORD_OF_TREATMENT' => '[?750 mg IV levofloxacin].',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertNotContains('levofloxacin', $result['unverified_terms']);
    }

    public function test_ignores_non_critical_fields_to_avoid_expansion_word_false_alarms(): void
    {
        // Expansion of "SOB" -> "shortness of breath" adds new words to
        // PATIENT_COMPLAINTS legitimately. This check must NOT scan such
        // fields; it is limited to drug/test heavy sections where entity
        // substitution is the specific documented failure mode.
        $raw = 'presenting with sob productive cough';
        $fields = [
            'PATIENT_COMPLAINTS' => 'Presenting with shortness of breath, productive cough.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $this->assertSame([], $result['unverified_terms']);
    }

    public function test_deduplicates_a_term_that_appears_in_multiple_fields(): void
    {
        $raw = 'blood drawn for cbc abg';
        $fields = [
            'INVESTIGATION' => 'Ordered procalcitonin.',
            'TREATMENT_PLAN' => 'Await procalcitonin result.',
        ];

        $result = $this->callReconcileCriticalTerms($raw, $fields);

        $procalcitoninCount = count(array_filter(
            $result['unverified_terms'],
            fn($t) => strtolower($t) === 'procalcitonin'
        ));

        $this->assertSame(1, $procalcitoninCount);
    }
}
