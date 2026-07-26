<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Locks in the fix for compound numeric normalization: the doctor commonly
 * dictates ratios/pairs in words ("pain score is 6 out of 10", "BP 152 over
 * 95"), and the AI legitimately formats them into a single token ("6/10",
 * "152/95"). The reconciler must treat both forms as equivalent — comparing
 * on ATOMS, not on the compound "a/b" glyph — otherwise every note with a
 * pain score or BP would falsely flag the individual numbers as missing.
 */
class TextAnalysisServiceCompoundNumberTest extends TestCase
{
    private function callReconcileNumbers(string $source, string $note): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'reconcileNumbers');
        $method->setAccessible(true);

        return $method->invoke($service, $source, $note);
    }

    public function test_pain_score_spelled_in_words_matches_slash_notation_in_note(): void
    {
        $source = 'pain score is 6 out of 10';
        $note = "PAIN SCORE:\n6/10";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
        $this->assertTrue($result['passed']);
    }

    public function test_blood_pressure_dictated_with_over_matches_slash_notation_in_note(): void
    {
        $source = 'BP is 152 over 95';
        $note = "PHYSICAL EXAMINATION:\nBP 152/95";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
        $this->assertTrue($result['passed']);
    }

    public function test_full_dictation_with_multiple_compound_pairs_produces_no_false_alarm(): void
    {
        // Reproduces the user's real COPD dictation shape: pain score 6/10,
        // BP 152/95, plus assorted stand-alone vitals — the exact combo that
        // was firing the "missing: 65" style false alarm in production.
        $source = 'pain score is 6 out of 10 vitals are rr 28 hr 115 BP 152 over 95 and spo2 is 86% ' .
            'we administered 3 rounds of nebulized 40 mg IV solved and 750 mg of IV level fluoxetine ' .
            'spo2 rising to 93% on 2 l nasal cannula';
        $note = "PAIN SCORE:\n6/10\n\nPHYSICAL EXAMINATION:\nRR 28, HR 115, BP 152/95, SpO2 86%.\n\n" .
            "RECORD OF TREATMENT:\n3 rounds nebulized albuterol, 40 mg IV solumedrol, 750 mg IV levofloxacin. " .
            "SpO2 improved to 93% on 2 L nasal cannula.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
        $this->assertTrue($result['passed']);
    }

    public function test_still_flags_a_number_that_the_slash_notation_actually_dropped(): void
    {
        // BP dictated with both readings; note only kept the systolic. The
        // diastolic (95) IS genuinely missing and MUST still be flagged.
        $source = 'BP is 152 over 95';
        $note = "PHYSICAL EXAMINATION:\nBP 152";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame(['95'], $result['missing_numbers']);
        $this->assertFalse($result['passed']);
    }

    public function test_range_fabrication_check_still_fires(): void
    {
        // The AI must not invent a range from two separate readings.
        $source = 'BP 138 over 88 and SpO2 is 91%';
        $note = "PHYSICAL EXAMINATION:\nBP 138/88, SpO2 88-91%";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame(['88-91'], $result['suspicious_ranges']);
        $this->assertFalse($result['passed']);
    }
}
