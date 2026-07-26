<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Locks in the deterministic safety net for the INJECTION path.
 *
 * analyzeByNote extracts a {name, age, gender, extra_fields: {...}} map that is
 * written directly into the external patient form with no human review. Before
 * this net, that path had zero verification. reviewExtractedFields runs the same
 * three checks the visible-note path uses, against the raw ASR transcript, after
 * flattening the clinical section fields nested under 'extra_fields'.
 */
class TextAnalysisServiceInjectionReviewTest extends TestCase
{
    private function callReviewExtractedFields(string $raw, array $extractedFields): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'reviewExtractedFields');
        $method->setAccessible(true);

        return $method->invoke($service, $raw, $extractedFields);
    }

    public function test_flags_substituted_drug_nested_under_extra_fields(): void
    {
        // The clinical field lives nested under extra_fields — the flatten step
        // must lift RECORD_OF_TREATMENT to the top level so the critical-term
        // check can see it and flag the substituted drug.
        $raw = 'we administered 3 rounds of nebulized to one 40 mg IV solved';
        $extractedFields = [
            'name' => 'John Doe',
            'age' => 65,
            'gender' => 'male',
            'extra_fields' => [
                'RECORD_OF_TREATMENT' => '3 rounds nebulized albuterol, 40 mg IV solumedrol.',
            ],
        ];

        $review = $this->callReviewExtractedFields($raw, $extractedFields);

        $this->assertContains('albuterol', $review['unverified_terms']);
        $this->assertFalse($review['passed']);
    }

    public function test_flags_acronym_not_present_in_raw_dictation(): void
    {
        $raw = 'blood drawn for cbc and troponins';
        $extractedFields = [
            'extra_fields' => [
                'INVESTIGATION' => 'Blood drawn for CBC and BNP.',
            ],
        ];

        $review = $this->callReviewExtractedFields($raw, $extractedFields);

        $this->assertContains('BNP', $review['unverified_entities']);
        $this->assertFalse($review['passed']);
    }

    public function test_flags_dropped_number(): void
    {
        $raw = 'respiratory rate 28 heart rate 115 blood pressure 152 over 95';
        $extractedFields = [
            'extra_fields' => [
                // HR 115 dropped from the injection data.
                'PHYSICAL_EXAMINATION' => 'RR 28, BP 152/95.',
            ],
        ];

        $review = $this->callReviewExtractedFields($raw, $extractedFields);

        $this->assertContains('115', $review['missing_numbers']);
        $this->assertFalse($review['passed']);
    }

    public function test_passes_clean_injection_data(): void
    {
        $raw = 'blood drawn for cbc abg bnp and respiratory rate 28';
        $extractedFields = [
            'name' => 'Jane Roe',
            'age' => 40,
            'gender' => 'female',
            'extra_fields' => [
                'INVESTIGATION' => 'Blood drawn for CBC, ABG, BNP.',
                'PHYSICAL_EXAMINATION' => 'Respiratory rate 28.',
            ],
        ];

        $review = $this->callReviewExtractedFields($raw, $extractedFields);

        $this->assertTrue($review['passed']);
        $this->assertSame([], $review['unverified_terms']);
        $this->assertSame([], $review['unverified_entities']);
        $this->assertSame([], $review['missing_numbers']);
    }

    public function test_does_not_flag_patient_age_as_missing_number(): void
    {
        // Age is a demographic marker, not a clinical value; the numeric check
        // strips "65 year old" so it is never flagged as dropped.
        $raw = 'patient is a 65 year old male with respiratory rate 28';
        $extractedFields = [
            'age' => 65,
            'extra_fields' => [
                'PHYSICAL_EXAMINATION' => 'RR 28.',
            ],
        ];

        $review = $this->callReviewExtractedFields($raw, $extractedFields);

        $this->assertNotContains('65', $review['missing_numbers']);
    }
}
