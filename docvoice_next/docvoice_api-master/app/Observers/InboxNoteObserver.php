<?php

namespace App\Observers;

use App\Models\InboxNote;

class InboxNoteObserver
{
    /**
     * Handle the InboxNote "created" event.
     */
    public function created(InboxNote $inboxNote): void
    {
        // التحليل الآن يتم في الـ controller مباشرة
        // No need to run analysis here to avoid duplication
    }

    /**
     * Handle the InboxNote "updated" event.
     */
    public function updated(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "deleted" event.
     */
    public function deleted(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "restored" event.
     */
    public function restored(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "force deleted" event.
     */
    public function forceDeleted(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * تشغيل التحليل التلقائي للملاحظة
     */
    private function runAutoAnalysis(InboxNote $inboxNote): void
    {
        try {
            $text = $inboxNote->raw_text ?? $inboxNote->original_text ?? $inboxNote->formatted_text ?? '';

            if (!empty(trim($text))) {
                $analysisService = app(\App\Services\TextAnalysisService::class);
                $analysisService->analyzeByNote($inboxNote, 'en', 'pattern');
            }
        } catch (\Exception $e) {
            // Log error without using Log facade to avoid permission issues
            error_log('Auto text analysis failed: ' . $e->getMessage());
        }
    }
}
