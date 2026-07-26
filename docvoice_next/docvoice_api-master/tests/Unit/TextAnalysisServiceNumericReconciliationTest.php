<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class TextAnalysisServiceNumericReconciliationTest extends TestCase
{
    private function callReconcileNumbers(string $source, string $note): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'reconcileNumbers');
        $method->setAccessible(true);

        return $method->invoke($service, $source, $note);
    }

    public function test_does_not_flag_a_spelled_out_age_that_the_template_has_no_field_for(): void
    {
        $source = 'Patient is a 65 year old male presenting with worsening cough.';
        $note = "PATIENT COMPLAINTS:\nWorsening cough.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
        $this->assertTrue($result['passed']);
    }

    public function test_still_flags_a_genuinely_missing_clinical_number_alongside_an_age_statement(): void
    {
        $source = 'Patient is a 65 year old male. RR 26, HR 115.';
        $note = "PHYSICAL EXAMINATION:\nHR 115.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame(['26'], $result['missing_numbers']);
        $this->assertFalse($result['passed']);
    }

    public function test_excludes_hyphenated_age_expression(): void
    {
        $source = 'This is a 65-year-old male with a cough.';
        $note = "PATIENT COMPLAINTS:\nCough.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
    }

    public function test_excludes_abbreviated_yo_age_expression(): void
    {
        $source = '65 y/o female with chest pain.';
        $note = "PATIENT COMPLAINTS:\nChest pain.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame([], $result['missing_numbers']);
    }

    public function test_does_not_exclude_a_plain_number_that_merely_precedes_the_word_day(): void
    {
        $source = 'A 3 day history of cough.';
        $note = "PATIENT COMPLAINTS:\nCough.";

        $result = $this->callReconcileNumbers($source, $note);

        $this->assertSame(['3'], $result['missing_numbers']);
    }
}
