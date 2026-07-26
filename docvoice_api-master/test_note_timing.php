<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\TextAnalysisService;
use Illuminate\Support\Facades\Log;

$text = "Patient is a 65 year old male presenting with a 3 day history of worsening SOB, productive yellowish cough, and right sided pleuritic chest pain. Pain score is 6 out of 10. Reception notes state the patient arrived via EMS on a stretcher in moderate distress. Patient alerts: strict allergy to Penicillin causing anaphylaxis. PMH is significant for severe COPD, type 2 DM, and HTN. On physical exam, he is tachypneic and using accessory muscles. Vitals are RR 28, HR 115, BP 152 over 95, and SpO2 is 86% on room air. Chest auscultation reveals diffuse bilateral expiratory wheezes and right lower lobe crackles. Investigations include a bedside ECG showing sinus tachycardia, clear bedside ultrasound, and pending portable CXR. Bloods drawn for CBC, ABG, and troponins. In the clinic, we administered 3 rounds of nebulized Duoneb, 40 mg IV Solu-Medrol, and 750 mg of IV Levofloxacin. Reassessment showed marked improvement with SpO2 rising to 93% on 2 liters nasal cannula. Diagnosis is acute exacerbation of COPD with suspected right lower lobe pneumonia. Type of illness is acute. Treatment plan is direct admission to the medical telemetry unit for continued IV antibiotics and bronchodilators. I strongly advised the patient and his son regarding smoking cessation and proper use of his home Symbicort inhaler, and educated the son on red flag signs like acute confusion or extreme lethargy.";

echo "Starting Timing Test...\n";
echo "Text length: " . strlen($text) . " characters\n\n";

$service = app(TextAnalysisService::class);
$reflection = new ReflectionClass($service);

$runRepairStage = $reflection->getMethod('runRepairStage');
$runRepairStage->setAccessible(true);

$runFormatStage = $reflection->getMethod('runFormatStage');
$runFormatStage->setAccessible(true);

$buildNoteFromParts = $reflection->getMethod('buildNoteFromParts');
$buildNoteFromParts->setAccessible(true);

echo "[1] Running Stage 1: Repair (runRepairStage) via OCI\n";
$start = microtime(true);
$repairResult = $runRepairStage->invoke($service, $text, 'oci');
$end = microtime(true);
$time1 = $end - $start;
echo "  -> Time taken: " . number_format($time1, 2) . " seconds\n";
if (isset($repairResult['error'])) {
    echo "  -> ERROR: " . $repairResult['error'] . "\n";
    exit;
}
echo "  -> Repaired Transcript Length: " . strlen($repairResult['repaired_transcript'] ?? '') . " chars\n\n";

echo "[2] Running Stage 2: Format (runFormatStage) for SOAP Template via OCI\n";
$start2 = microtime(true);
$instruction = "Format the note using standard SOAP structure (Subjective, Objective, Assessment, Plan).";
$formatResult = $runFormatStage->invoke($service, $repairResult['repaired_transcript'], $instruction, 'oci');
$end2 = microtime(true);
$time2 = $end2 - $start2;
echo "  -> Time taken: " . number_format($time2, 2) . " seconds\n";
if (isset($formatResult['error'])) {
    echo "  -> ERROR: " . $formatResult['error'] . "\n";
    exit;
}
echo "  -> Extracted Fields Count: " . count($formatResult['fields'] ?? []) . "\n\n";

echo "[3] Running Safety Nets & Render (buildNoteFromParts)\n";
$start3 = microtime(true);
$noteResult = $buildNoteFromParts->invoke(
    $service, 
    $formatResult['fields'], 
    $repairResult['repaired_transcript'], 
    $repairResult['flags'] ?? [], 
    $repairResult['patient_info'] ?? null, 
    $text, 
    'oci', 
    null
);
$end3 = microtime(true);
$time3 = $end3 - $start3;
echo "  -> Time taken: " . number_format($time3, 4) . " seconds\n";
echo "  -> Review Passed: " . ($noteResult['review']['passed'] ? 'Yes' : 'No') . "\n\n";

echo "=== TOTAL TIME: " . number_format($time1 + $time2 + $time3, 2) . " seconds ===\n";
