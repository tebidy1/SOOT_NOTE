<?php

namespace Tests\Unit;

use App\Services\TextAnalysisService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class TextAnalysisServiceReconciliationTest extends TestCase
{
    private function callReconcileEntities(string $repairedTranscript, array $fields): array
    {
        $service = new TextAnalysisService();
        $method = new ReflectionMethod(TextAnalysisService::class, 'reconcileEntities');
        $method->setAccessible(true);

        return $method->invoke($service, $repairedTranscript, $fields);
    }

    public function test_flags_an_acronym_in_the_fields_that_never_appears_in_the_repaired_transcript(): void
    {
        $repaired = 'Blood drawn for CBC, ABG, and troponin.';
        $fields = ['INVESTIGATION' => 'Blood drawn for CBC, ABG, BNP.'];

        $result = $this->callReconcileEntities($repaired, $fields);

        $this->assertSame(['BNP'], $result['unverified_entities']);
    }

    public function test_does_not_flag_acronyms_that_appear_in_the_repaired_transcript(): void
    {
        $repaired = 'Vitals are RR 28, HR 115, BP 152/95, IV fluids given.';
        $fields = ['PHYSICAL_EXAMINATION' => 'RR 28, HR 115, BP 152/95. IV access obtained.'];

        $result = $this->callReconcileEntities($repaired, $fields);

        $this->assertSame([], $result['unverified_entities']);
    }

    public function test_matching_is_case_insensitive(): void
    {
        $repaired = 'pmh is significant for severe copd, type 2 dm and htn';
        $fields = ['HISTORY_OF_PATIENT_ILLNESSES' => 'Severe COPD, type 2 DM, HTN.'];

        $result = $this->callReconcileEntities($repaired, $fields);

        $this->assertSame([], $result['unverified_entities']);
    }

    public function test_does_not_flag_the_not_reported_marker(): void
    {
        $repaired = 'Patient reports no other complaints.';
        $fields = ['OTHER_CONDITIONS' => '[Not Reported]'];

        $result = $this->callReconcileEntities($repaired, $fields);

        $this->assertSame([], $result['unverified_entities']);
    }

    public function test_deduplicates_repeated_unverified_acronyms(): void
    {
        $repaired = 'Chest pain noted.';
        $fields = [
            'INVESTIGATION' => 'Ordered BNP.',
            'RECORD_OF_TREATMENT' => 'BNP pending.',
        ];

        $result = $this->callReconcileEntities($repaired, $fields);

        $this->assertSame(['BNP'], $result['unverified_entities']);
    }
}
